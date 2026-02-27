import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { initializeUrl } from './utils/urlStateSync.js'

// Initialize default URL jika kosong
if (!window.location.search || window.location.search === '?') {
  initializeUrl();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
