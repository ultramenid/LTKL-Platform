import './App.css'
import { LeftPanel } from './components/LeftPanel'
import { RightPanel } from './components/RightPanel'

function App() {
  return (
    <>
      <div className='h-screen flex'>
        <div className='w-[22%]'>
          <LeftPanel />
        </div>
        <div className='w-[78%]'> 
          <RightPanel />
        </div>
      </div>
    </>
  )
}

export default App
