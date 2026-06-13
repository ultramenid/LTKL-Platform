// Clear persisted caches on a browser HARD reload (Cmd/Ctrl+Shift+R).
//
// A plain reload keeps our localStorage caches on purpose (chart/map data
// survives refresh). But a hard reload is the user's "give me a clean slate"
// gesture — and since it bypasses the HTTP cache, it's confusing that our
// localStorage cache silently survives. This makes a hard reload clear it too.
//
// Browsers expose no direct "hard reload" flag (both soft and hard report
// navigation.type === 'reload'). The reliable tell: a hard reload re-requests
// even immutable hashed assets from the network, while a soft reload serves
// them from cache. So a same-origin immutable build asset with transferSize > 0
// on a reload means the HTTP cache was bypassed ⇒ hard reload.
//
// We deliberately scope the check to /assets/* only:
//   - In development Vite serves unhashed modules without long-term caching, so
//     checking every script/link would false-positive on every soft reload.
//   - Cross-origin links (fonts, CDN CSS) can also revalidate on soft reload and
//     must not be treated as a hard-reload signal.
//
// IMPORTANT: this module must be imported FIRST in main.jsx — before App and the
// store — because mapStore reads localStorage at module-eval time. ES modules
// evaluate imports in source order, so a side-effecting import placed first runs
// before any cache hydration.
import { CACHE_CONFIG } from '../config/constants.js';

function wasHardReload() {
  try {
    const [navigationEntry] = performance.getEntriesByType('navigation');
    if (!navigationEntry || navigationEntry.type !== 'reload') return false;

    const assetEntries = performance
      .getEntriesByType('resource')
      .filter((entry) => {
        if (entry.initiatorType !== 'script' && entry.initiatorType !== 'link') {
          return false;
        }
        const url = new URL(entry.name, window.location.href);
        return url.origin === window.location.origin && url.pathname.startsWith('/assets/');
      });

    // No immutable build assets present (e.g. Vite dev). Don't guess.
    if (assetEntries.length === 0) return false;

    // decodedBodySize > 0 → a real asset (not a 0-byte/error entry).
    // transferSize > 0 → fetched over the network, not served from cache.
    return assetEntries.some(
      (entry) => entry.decodedBodySize > 0 && entry.transferSize > 0,
    );
  } catch {
    return false;
  }
}

if (wasHardReload()) {
  try {
    localStorage.removeItem(CACHE_CONFIG.STORAGE_KEY_GEE);
    localStorage.removeItem(CACHE_CONFIG.STORAGE_KEY_GEOJSON);
    localStorage.removeItem(CACHE_CONFIG.STORAGE_KEY_STATS);
  } catch {
    // Ignore storage errors — a failed clear just means the cache stays warm.
  }
}
