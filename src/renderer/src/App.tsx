import Versions from './components/Versions'
import Electron from './assets/electron.svg'
import ConnectedBtn from './assets/thunder.png'
import { useState, useEffect } from 'react'
import { FaCog } from 'react-icons/fa'
import { FaNetworkWired } from 'react-icons/fa6'
import { BsFillDeviceHddFill } from 'react-icons/bs'
function App(): JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  const [width, setWidth] = useState<number>(window.innerWidth)

  useEffect(() => {
    const handleResize = (): void => {
      setWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)

    return (): void => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="bg-primaryBg h-dvh w-full text-white">
      <div className="container grid grid-cols-1 md:grid-cols-2 pt-5">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">RadLab File Watcher</h2>
            <span>
              <FaCog className="text-2xl" />
            </span>
          </div>
          <div className="border border-primary rounded-2xl py-3 text-center">
            <h1 className="font-bold text-5xl">00:21:25</h1>
          </div>
          <h2 className="text-center text-textSecondary">Connecting time</h2>
          <div className="flex items-center justify-center">
            <div className="border border-primaryBg border-r-textSecondary pr-10 flex gap-3">
              <FaNetworkWired className="text-primary text-3xl" />
              <div>
                <h4 className="font-semibold">Network</h4>
                <span className="text-textSecondary text-sm">Connected</span>
              </div>
            </div>
            <div className="border border-primaryBg border-l-textSecondary pl-10 flex gap-3">
              <BsFillDeviceHddFill className="text-primary text-3xl" />
              <div>
                <h4 className="font-semibold">Drives</h4>
                <span className="text-textSecondary text-sm">Connected</span>
              </div>
            </div>
          </div>
          <div className="flex pt-3 justify-center items-center btn-container">
            <img
              src={ConnectedBtn}
              className="bg-primary rounded-full btn-pulse h-auto w-[150px] z-10"
              alt="btn"
            />
            <div className="btn-shadow"></div>
          </div>
        </div>

        <div className="flex justify-center items-center">B</div>
        <h2 className="mt-5">Current Window Width: {width}</h2>
      </div>
    </div>
  )
}

export default App
