import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { initializeUrl } from './utils/urlStateSync.js'

// Initialize default URL jika kosong
if (!window.location.search || window.location.search === '?') {
  initializeUrl();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
