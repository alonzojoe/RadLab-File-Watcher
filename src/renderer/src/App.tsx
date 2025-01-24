import Versions from './components/Versions'

function App(): JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <h1 className="text-amber-500">qwewqewqe</h1>
      <button onClick={ipcHandle}>Clicked</button>
      <Versions></Versions>
    </>
  )
}

export default App
