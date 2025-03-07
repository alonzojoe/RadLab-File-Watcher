import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { basename, join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/appIcon.png?asset'
import type { MappedDrives, TFileStable, TMessage } from '../types/types'
import moment from 'moment'
import fs from 'fs'
import fsExtra from 'fs-extra'
import crypto from 'crypto'
import { DIRECTORIES } from '../constants/constants'
import chokidar, { type FSWatcher } from 'chokidar'
// import { extractFileName } from '../renderer/src/libs/utils'
import path from 'path'
import { connectDB, updateDocumentPath } from '../config/database'
import EventEmitter from 'events'

type ReturnValue = [string, string, string]

export const extractFileName = <T extends string>(fileName: T): ReturnValue => {
  const parts = fileName.split('&')
  const getLisTemplateCode = `LAB-FM-${parts[4]}`
  const getRenderNumberWithExtension = parts[5]
  const getRenderNumber = getRenderNumberWithExtension.split('.')[0]

  const rawPatientName = parts[3]
  const patientNameParts = rawPatientName.split('^')
  const formattedPatientName = `${patientNameParts[0]}, ${patientNameParts.slice(1).join(' ')}`

  return [getLisTemplateCode, getRenderNumber, formattedPatientName]
}

let watcher: FSWatcher | null = null
let mainWindow: BrowserWindow | null = null
const dateNow = moment().format('YYYY-MM-DD HH:mm:ss.SSS')

const emitter = new EventEmitter()

emitter.setMaxListeners(999999)

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 466,
    height: 712,
    show: false,
    resizable: false,
    autoHideMenuBar: true,
    icon: icon,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (!mainWindow) return

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  function sendData(data = 'test electron to react component'): void {
    mainWindow!.webContents.send('receiveData', data)
  }
  sendData()
}

//startFileWatcher
//FileSystemStart

const checkMappedDrives = (drives: MappedDrives): void => {
  const missingDrivers: string[] = []

  if (!fs.existsSync(drives.orders_directory)) {
    missingDrivers.push(drives.orders_directory)
  }

  if (!fs.existsSync(drives.target_directory)) {
    missingDrivers.push(drives.target_directory)
  }

  if (missingDrivers.length > 0) {
    const rawMessage = missingDrivers.join(' and ')
    const drivePlural = missingDrivers.length > 1 ? 's' : ''
    const finalMessage = `Drive${drivePlural} ${rawMessage} do not exist in the Windows devices & drives.`
    mainWindow?.webContents.send('drive-not-found', {
      message: finalMessage,
      plural: drivePlural
    })
    console.log(finalMessage)
  }
}

const setTerminal = (color: string, results: string): void => {
  const formattedTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS')
  const messageToSend = {
    timestamp: formattedTime,
    text: results,
    color
  } satisfies TMessage
  console.log('message', messageToSend)
  sendDataToComponent(messageToSend)
}

const isFileStable = async ({
  filepath,
  interval = 500,
  retries = 15
}: TFileStable): Promise<boolean | void> => {
  let lastSize = 0

  for (let i = 0; i < retries; i++) {
    const { size } = await fsExtra.stat(filepath)

    if (size === lastSize) {
      return true
    }

    lastSize = size
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
}

const hashedFileName = async (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5')
    const stream = fs.createReadStream(filePath)
    stream.on('data', (data) => hash.update(data))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', (err) => reject(err))
  })
}

const sendDataToComponent = (data: TMessage): void => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow?.webContents.send('data-to-component', data)
  }
}

const handleFileCopyError = async (
  err: NodeJS.ErrnoException,
  retries: number,
  maxRetries: number,
  fileName: string,
  tempDestinationPath: string
): Promise<void> => {
  if (err.code === 'EBUSY' && retries < maxRetries - 1) {
    console.log(`Retrying copy (${retries + 1}/${maxRetries})...`)
    await new Promise((resolve) => setTimeout(resolve, 10000))
  } else {
    console.error(`Error copying ${fileName}: ${err.message}`)

    if (fs.existsSync(tempDestinationPath)) {
      await fsExtra.remove(tempDestinationPath)
    }
  }
  return
}

let watcherRunning = false
let monitorInterval: NodeJS.Timeout | null = null

const startFileWatcher = (): void => {
  const ordersFolder = DIRECTORIES.orders_directory
  const targetFolder = DIRECTORIES.target_directory

  if (watcherRunning) {
    return
  }

  watcher = chokidar.watch(ordersFolder, {
    ignored: /^\./,
    persistent: true
  })

  watcherRunning = true
  console.log(`Watching changes in ${ordersFolder}`)

  let isProcessing = false
  const watcherQueue: string[] = []

  const tryToMoveFile = async (filePath: string): Promise<void> => {
    const fileName = basename(filePath)
    const fileDate = moment()

    const year = fileDate.format('YYYY')
    const month = fileDate.format('MM')
    const day = fileDate.format('DD')

    const pathYear = join(targetFolder, year)
    const pathMonth = join(pathYear, month)
    const pathDay = join(pathMonth, day)
    const tempDestinationPath = join(pathDay, `${fileName}.tmp`)
    const finalDestinationPath = join(pathDay, fileName)
    ///api endpoint check

    //
    ///end api endpoint check

    await ensureDirectories([pathYear, pathMonth, pathDay])

    await isFileStable({
      filepath: filePath,
      interval: 500,
      retries: 5
    })

    const originalHashFileName = await hashedFileName(filePath)

    const max_retries = 3

    for (let retries = 0; retries < max_retries; retries++) {
      try {
        console.log('Copying file to target directory: ')
        await fsExtra.copy(filePath, tempDestinationPath)

        const copiedHashFileName = await hashedFileName(tempDestinationPath)

        if (originalHashFileName !== copiedHashFileName) {
          throw new Error(`Hashed File mismatch: ${fileName}`)
        }

        //file renaming
        await fsExtra.move(tempDestinationPath, finalDestinationPath, { overwrite: true })

        console.log(`Copied ${fileName} successully`)

        await finalizedFileProcess(filePath, fileName, finalDestinationPath)
        return
      } catch (error) {
        if (error instanceof Error && 'code' in error) {
          await handleFileCopyError(
            error as NodeJS.ErrnoException,
            retries,
            max_retries,
            fileName,
            tempDestinationPath
          )
        }
      }
    }
  }

  let processNextFileTimeout: NodeJS.Timeout | null = null
  const finalizedFileProcess = async (
    filePath: string,
    fileName: string,
    destinationPath: string
  ): Promise<void> => {
    try {
      console.log(`Removing source file: ${filePath}`)
      await fsExtra.remove(filePath)

      const patientDetails = extractFileName(fileName) // to be used in api call
      console.log('Extracted File Name', patientDetails)
      //api call here
      const templateCode = patientDetails[0]
      const renderNumber = patientDetails[1]
      const patientName = patientDetails[2]

      await updateDocumentPath(templateCode, renderNumber, destinationPath)

      console.log('LIS TemplateCode', templateCode)
      console.log('Render Number', renderNumber)
      console.log('PatientName', patientName)
      console.log('Document Path', destinationPath)

      const data = {
        timestamp: dateNow,
        color: `text-green-500`,
        text: `${patientName} results have been uploaded`
      }

      sendDataToComponent(data)
      //end api call here

      //send message to component
    } catch (error) {
      if (error instanceof Error) {
        console.log(`an error occured ${error?.message}`)
      }
    }

    if (processNextFileTimeout) {
      clearTimeout(processNextFileTimeout)
    }

    processNextFileTimeout = setTimeout(processNextFile, 15000)
  }

  const processNextFile = (): void => {
    const nextFile = watcherQueue.shift()
    if (nextFile) {
      tryToMoveFile(nextFile)
    } else {
      isProcessing = false
    }
  }

  const ensureDirectories = async (dirs: string[]): Promise<void> => {
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        await fsExtra.ensureDir(dir)
        setTerminal('text-green-500', `Folder created: ${dir}`)
      } else {
        setTerminal('text-yellow-500', `Folder exists: ${dir}`)
      }
    }
  }

  watcher.on('add', (filePath: string) => {
    const fileExtension = path.extname(filePath).toLowerCase()
    if (fileExtension === '.pdf') {
      if (!isProcessing && fs.existsSync(filePath)) {
        isProcessing = true
        watcherQueue.push(filePath)

        const fileToProcess = watcherQueue.shift()

        if (fileToProcess) {
          tryToMoveFile(fileToProcess)
        }
      } else if (fs.existsSync(filePath)) {
        watcherQueue.push(filePath)
      } else {
        console.error(`File does not exist: ${filePath}`)
      }
    }
  })

  watcher.on(`error`, (error: unknown) => {
    if (error instanceof Error) {
      console.log('File Watcher caught and Error', error?.message)
    } else {
      console.log(`Unexpected Error type: ${error}`)
    }
  })

  // watcher!.on('close', () => {
  //   console.log('File Watcher stopped')
  //   watcherRunning = false
  // })

  startMonitor()
}

const stopFileWatcher = (): void => {
  if (watcher) {
    watcher.close()
    watcher = null
    sendDataToComponent({
      timestamp: dateNow,
      color: `text-red-500`,
      text: `File Watcher stopped.`
    })
    watcherRunning = false
  } else {
    console.log('File Watcher is not running')
  }

  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null
  }
}

const restartFileWatcher = (): void => {
  console.log(`Restarting File Watcher...`)
  stopFileWatcher()

  if (!watcherRunning) {
    setTimeout(() => {
      startFileWatcher()
    }, 5000)
  } else {
    console.log('File Watcher is already running')
  }
}

const startMonitor = (): void => {
  if (monitorInterval) return

  monitorInterval = setInterval(() => {
    if (!watcherRunning) {
      console.log(`Watcher is not running. Restarting...`)
      restartFileWatcher()
    }
  }, 10000)
}

app.whenReady().then(async () => {
  await connectDB()
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  //ipcMain to component start

  ipcMain.on('startFileWatcher', () => {
    console.log('File Watcher started')
    sendDataToComponent({
      timestamp: dateNow,
      color: `text-green-500`,
      text: `File Watcher started.`
    })
    startFileWatcher()
  })

  ipcMain.on('stopFileWatcher', () => {
    stopFileWatcher()
  })

  ipcMain.on('pingx', () => {
    console.log('startFileWatcherrrrrrrrr')
  })

  ipcMain.on('ping', () => {
    console.log('startFileWatcherrrrrrrrrs')
    const data = {
      timestamp: '2025-01-27 09:57:21 AM',
      color: 'text-green-500',
      text: 'Patients Results has been uploaded'
    }
    console.log('data', data)

    sendDataToComponent(data)
  })

  //ipcMain to component end
  createWindow()

  setTimeout(() => {
    checkMappedDrives(DIRECTORIES)
  }, 3000)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
