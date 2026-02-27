import './App.css'
import { useEffect } from 'react'
import { Routes, Route, useParams } from 'react-router-dom'
import { useMapStore } from './store/mapStore'
import { parseUrlState } from './utils/urlStateSync'
import { LeftPanel } from './components/LeftPanel'
import { RightPanel } from './components/RightPanel'
import { ProfilePage } from './components/ProfilePage'

function MapView() {
  // Restore state dari URL query params saat di map view
  useEffect(() => {
    const { year, breadcrumbs, selectedKab } = parseUrlState();
    useMapStore.setState({ year, breadcrumbs, selectedKab });
  }, []);

  return (
    <div className='h-screen flex'>
      <div className='w-[22%]'>
        <LeftPanel />
      </div>
      <div className='w-[78%]'> 
        <RightPanel />
      </div>
    </div>
  );
}

// Wrapper untuk ProfilePage agar bisa akses URL params via useParams
function ProfilePageWrapper() {
  const { kabupatenName } = useParams();
  return <ProfilePage kabupatenName={decodeURIComponent(kabupatenName)} />;
}

function App() {
  return (
    <Routes>
      {/* Map view: rute awal */}
      <Route path="/" element={<MapView />} />
      
      {/* Profile page: /profile/NamaKabupaten */}
      <Route path="/profile/:kabupatenName" element={<ProfilePageWrapper />} />
    </Routes>
  );
}

export default App
