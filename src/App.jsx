import './App.css';
import { useEffect, useState, useRef } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { useMapStore } from './store/mapStore';
import { parseUrlState } from './utils/urlStateSync';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { ProfilePage } from './components/ProfilePage';
import { ErrorBoundary } from './components/ErrorBoundary';

function MapView() {
  const mainRef = useRef(null);

  // Restore state from URL query params when entering map view
  useEffect(() => {
    const { year, breadcrumbs, selectedKab } = parseUrlState();
    useMapStore.setState({ year, breadcrumbs, selectedKab });
  }, []);

  // Dynamic document title for SEO
  useEffect(() => {
    document.title = 'LTKL Platform — Peta Gotong Royong Kabupaten Lestari';
  }, []);

  // Sidebar drawer state — only active on mobile (lg+ sidebar always visible)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex relative overflow-hidden">
      {/* Dark backdrop when sidebar is open on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar: fixed drawer on mobile, static column on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
          lg:relative lg:w-[22%] lg:translate-x-0 lg:z-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <LeftPanel onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:text-gray-900 focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:font-medium focus:text-sm"
      >
        Lompat ke konten utama
      </a>

      {/* Right panel: full width on mobile, 78% on desktop */}
      <div id="main-content" ref={mainRef} className="flex-1 min-w-0" tabIndex={-1}>
        <ErrorBoundary label="Peta dan Analitik">
          <RightPanel onToggleSidebar={() => setIsSidebarOpen((previous) => !previous)} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

// Wrapper for ProfilePage so it can access URL params via useParams
function ProfilePageWrapper() {
  const { kabupatenName } = useParams();
  return <ProfilePage kabupatenName={decodeURIComponent(kabupatenName)} />;
}

function App() {
  return (
    <ErrorBoundary label="Aplikasi">
      <Routes>
        {/* Map view: default route */}
        <Route path="/" element={<MapView />} />

        {/* Profile page: /profile/NamaKabupaten */}
        <Route path="/profile/:kabupatenName" element={<ProfilePageWrapper />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
