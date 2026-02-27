import './App.css'
import { useEffect } from 'react'
import { useMapStore } from './store/mapStore'
import { parseUrlState } from './utils/urlStateSync'
import { LeftPanel } from './components/LeftPanel'
import { RightPanel } from './components/RightPanel'

function App() {
  // Restore state dari URL on mount
  useEffect(() => {
    const { year, breadcrumbs, selectedKab } = parseUrlState();
    
    // Set state langsung (akan trigger subscriber)
    useMapStore.setState({ year, breadcrumbs, selectedKab });
  }, []);

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
