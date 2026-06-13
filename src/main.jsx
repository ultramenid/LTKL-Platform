// Must run before App/store imports: clears persisted caches on a hard reload
// while localStorage is still untouched (mapStore hydrates at module-eval time).
import './lib/cacheReset.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { initializeUrl } from './utils/urlStateSync.js';

if (!window.location.search || window.location.search === '?') {
  initializeUrl();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
