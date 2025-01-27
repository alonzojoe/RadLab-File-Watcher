import { app, shell, BrowserWindow, ipcMain, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import type { MappedDrives, TFileStable } from '../types/types'
import moment from 'moment'
import fs from 'fs'
import fsExtra from 'fs-extra'
import crypto from 'crypto'

let watcher = null
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 466,
    height: 712,
    show: false,
    autoHideMenuBar: true,
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

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

//FileSystemStart

const checkMappedDrives = (drives: MappedDrives) => {
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
    console.log(finalMessage)
  }
}

const setTerminal = (color: string, results: string) => {
  const formattedTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS')
  const messageToSend = {
    timestamp: formattedTime,
    text: results,
    color
  }
  console.log('message', messageToSend)
}

const isFileStable = async ({ filepath, interval = 500, retries = 5 }: TFileStable) => {
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

const hashedFileName = async (filePath: string) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5')
    const stream = fs.createReadStream(filePath)
    stream.on('data', (data) => hash.update(data))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', (err) => reject(err))
  })
}
