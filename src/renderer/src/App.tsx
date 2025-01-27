import ConnectedBtn from './assets/thunder.png'
import DisconnectedBtn from './assets/off.png'
import WatcherImg from './assets/Watcher.png'
import { useState, useEffect } from 'react'
import { FaCog } from 'react-icons/fa'
import { FaNetworkWired } from 'react-icons/fa6'
import { BsFillDeviceHddFill } from 'react-icons/bs'
import Terminal from './components/Terminal'
import useToggle from './hooks/useToggle'

const { ipcRenderer } = window.electron

function App(): JSX.Element {
  const ipcHandle = (): void => ipcRenderer.send('ping')
  const [count, setCount] = useState(0)
  const [width, setWidth] = useState<number>(window.innerWidth)
  const [height, setHeight] = useState<number>(window.innerHeight)
  const [isOn, toggleIsOn] = useToggle(false)

  ipcRenderer.on('receiveData', (_, data: string) => {
    console.log(data)
  })

  useEffect(() => {
    let i: NodeJS.Timeout
    if (isOn) {
      i = setInterval(() => {
        setCount((prev) => prev + 1)
      }, 1000)
    }

    return (): void => {
      clearInterval(i)
    }
  }, [isOn])

  useEffect(() => {
    const handleResize = (): void => {
      setWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)

    return (): void => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const handleResize = (): void => {
      setHeight(window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return (): void => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="bg-primaryBg  w-full text-white">
      <div className="container grid gap-5 md:gap-8 grid-cols-1 md:grid-cols-2 pt-5 md:mt-5">
        <div className="space-y-4">
          {/* <div className="flex justify-center">
            <img src={WatcherImg} className="h-auto w-[200px] transform -scale-x-100" alt="asd" />
          </div> */}
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-semibold py-3">RadLab File Watcher </h2>

            {/* <label className="inline-flex items-center pointer-events-none ">
              <input
                className="cursor-pointer sr-only peer"
                type="checkbox"
                data-true-value={true}
                data-false-value={false}
                checked={isOn}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary dark:peer-checked:bg-primary"></div>
            </label> */}
          </div>
          <div className="border border-primary rounded-2xl py-3 text-center">
            <h1 className="font-bold text-5xl">00:21:25</h1>
          </div>
          <h2 className="text-center text-textSecondary">
            Connecting time {count} {height}
          </h2>
          <div className="flex items-center justify-center">
            <div className="border border-primaryBg border-r-textSecondary pr-10 flex gap-3">
              <FaNetworkWired className="text-primary text-3xl" />
              <div>
                <h4 className="font-semibold">Network</h4>
                <span className="text-green-400 text-sm">Connected</span>
              </div>
            </div>
            <div className="border border-primaryBg border-l-textSecondary pl-10 flex gap-3">
              <BsFillDeviceHddFill className="text-primary text-3xl" />
              <div>
                <h4 className="font-semibold">Drives</h4>
                <span className="text-green-400 text-sm">Connected</span>
              </div>
            </div>
          </div>
          <div className="flex pt-3 justify-center items-center btn-container">
            <img
              src={isOn ? ConnectedBtn : DisconnectedBtn}
              className="bg-primary rounded-full cursor-pointer btn-pulse h-auto w-[150px] z-10"
              alt="btn"
              onClick={() => toggleIsOn()}
            />
            {isOn && <div className="btn-shadow"></div>}
          </div>
        </div>
        <div className="flex flex-col items-center justify-start">
          <div className="hidden md:block">
            {/* <img src={WatcherImg} className="h-auto w-[630px]" alt="asd" /> */}
            <Terminal />
          </div>
          <div className="flex justify-center items-center md:hidden mt-5">
            <Terminal />
          </div>
        </div>
      </div>
      {/* <div className="container pt-5 hidden md:block">
        <Terminal />
      </div> */}
    </div>
  )
}

export default App
