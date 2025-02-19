import { FaNetworkWired } from 'react-icons/fa6'
import { BsFillDeviceHddFill } from 'react-icons/bs'

const Devices = (): JSX.Element => {
  return (
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
  )
}

export default Devices
