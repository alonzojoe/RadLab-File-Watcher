import ConnectedBtn from './assets/thunder.png'
import DisconnectedBtn from './assets/off.png'
import WatcherImg from './assets/Watcher.png'
import { useState, useReducer, useEffect } from 'react'
import { FaCog } from 'react-icons/fa'

import Terminal from './components/Terminal'
import useToggle from './hooks/useToggle'
import moment from 'moment'
import { TerminalMessage, DriveErrorMessage, Drive } from './types'
import Header from './components/Header'
import Message from './components/Message'
import Devices from './components/Devices'

const { ipcRenderer } = window.electron
const dateNow = moment().format('YYYY-MM-DD HH:mm:ss.SSS')
const initialMessageState = [
  {
    timestamp: dateNow,
    color: `text-green-500`,
    text: `Welcome to LIS File Watcher`
  }
]

const initialDriveState: Drive = {
  isDisabled: false,
  title: '',
  message: ''
}

const ACTIONS = {
  DISABLE_DRIVE: 'disable-drive',
  ENABLE_DRIVE: 'enable-drive'
}

type Action =
  | { type: typeof ACTIONS.DISABLE_DRIVE; payload: DriveErrorMessage }
  | { type: typeof ACTIONS.ENABLE_DRIVE; payload: { params: Drive } }

const driveReducer = (state: Drive, action: Action): Drive => {
  switch (action.type) {
    case ACTIONS.DISABLE_DRIVE:
      if ('message' in action.payload && 'plural' in action.payload) {
        const { message, plural } = action.payload
        return {
          ...state,
          isDisabled: true,
          title: `Missing Drive${plural}`,
          message: message
        }
      }

      return state

    case ACTIONS.ENABLE_DRIVE:
      return {
        ...initialDriveState
      }

    default:
      return state
  }
}

function App(): JSX.Element {
  const ipcHandle = (): void => ipcRenderer.send('startFileWatcher')
  const [isOn, toggleIsOn] = useToggle(false)
  const [messages, setMessages] = useState<TerminalMessage[]>(initialMessageState)
  const [drive, dispatchDrive] = useReducer(driveReducer, initialDriveState)

  ipcRenderer.on('receiveData', (_, data: string) => {
    console.log(data)
  })

  useEffect(() => {
    const errorDrive = (data: DriveErrorMessage): void => {
      dispatchDrive({ type: ACTIONS.DISABLE_DRIVE, payload: data })
    }

    ipcRenderer.on('data-to-component', (_, data) => {
      console.log('data received in react component', data)
      setMessages((message) => [...message, data])
    })

    ipcRenderer.on('drive-not-found', (_, data) => {
      console.log('data drive-not-found', data)
      errorDrive(data)
    })

    let intervalId: NodeJS.Timeout | null = null

    const startInterval = (): void => {
      if (intervalId) {
        clearInterval(intervalId)
      }

      intervalId = setInterval(() => {
        clearTerminal()
      }, moment.duration(2, 'hours').asMilliseconds())
    }

    const stopInterval = (): void => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }

    startInterval()
    return (): void => {
      stopInterval()
    }
  }, [])

  const startFileWatcher = (): void => {
    toggleIsOn()
    ipcHandle()
  }

  const clearTerminal = (): void => {
    const resetMessage = {
      timestamp: dateNow,
      color: `text-white`,
      text: `The terminal was automatically cleared.`
    } satisfies TerminalMessage

    setMessages([resetMessage])
  }

  return (
    <div className="bg-primaryBg  w-full text-white">
      {drive.isDisabled && <Message message={drive.message} title={drive.title} />}
      <div className="container grid gap-5 md:gap-8 grid-cols-1 md:grid-cols-2 pt-5 md:mt-5">
        <div className="space-y-4">
          <Header isOn={isOn} />
          <div className="border border-primary rounded-2xl py-3 text-center">
            <h1 className="font-bold text-5xl">00:21:25</h1>
          </div>
          <h2 className="text-center text-textSecondary">Connecting time</h2>
          <Devices />
          <div className="flex pt-3 justify-center items-center btn-container">
            <img
              src={isOn ? ConnectedBtn : DisconnectedBtn}
              className="bg-primary rounded-full cursor-pointer btn-pulse h-auto w-[150px] z-10"
              alt="btn"
              onClick={startFileWatcher}
            />
            {isOn && <div className="btn-shadow"></div>}
          </div>
        </div>
        <div className="flex flex-col items-center justify-start">
          <div className="hidden md:block w-full">
            {/* <img src={WatcherImg} className="h-auto w-[630px]" alt="asd" /> */}
            <Terminal messages={messages} />
          </div>
          <div className="flex justify-center items-center md:hidden mt-5 w-full">
            <Terminal messages={messages} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
