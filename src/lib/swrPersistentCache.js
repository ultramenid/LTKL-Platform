// SWR cache provider that persists chart stats to localStorage so chart data
// survives a manual page refresh. Only tile-server stats responses are
// persisted (with TTL), everything else stays in-memory only.

import { API_ENDPOINTS, CACHE_CONFIG } from '../config/constants.js';

function loadValidStoredEntries() {
  try {
    const storedJson = localStorage.getItem(CACHE_CONFIG.STORAGE_KEY_STATS);
    if (!storedJson) return {};

    const allCacheEntries = JSON.parse(storedJson);
    const currentTime = Date.now();

    // Remove expired entries on load
    const validEntries = {};
    for (const [cacheKey, cacheEntry] of Object.entries(allCacheEntries)) {
      if (cacheEntry.expiresAt && cacheEntry.expiresAt > currentTime) {
        validEntries[cacheKey] = cacheEntry;
      }
    }
    return validEntries;
  } catch {
    // if localStorage errors, start with an empty cache
    return {};
  }
}

function isPersistableEntry(cacheKey, cacheState) {
  return (
    typeof cacheKey === 'string' &&
    cacheKey.startsWith(API_ENDPOINTS.TILE_SERVER) &&
    cacheState &&
    cacheState.data !== undefined &&
    cacheState.error === undefined
  );
}

function isQuotaExceededError(error) {
  return (
    error?.name === 'QuotaExceededError' ||
    error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error?.code === 22 ||
    error?.code === 1014
  );
}

// Drop expired entries from a mapCache_* store ({ value, expiresAt } shape).
// Returns true if anything was removed.
function pruneExpiredStoreEntries(storageKey) {
  try {
    const storedJson = localStorage.getItem(storageKey);
    if (!storedJson) return false;

    const allEntries = JSON.parse(storedJson);
    const currentTime = Date.now();
    const validEntries = {};
    let removedAny = false;
    for (const [entryKey, entry] of Object.entries(allEntries)) {
      if (entry.expiresAt && entry.expiresAt > currentTime) validEntries[entryKey] = entry;
      else removedAny = true;
    }
    if (removedAny) localStorage.setItem(storageKey, JSON.stringify(validEntries));
    return removedAny;
  } catch {
    return false;
  }
}

// Boundary GeoJSON is by far the largest localStorage consumer and is cheap to
// refetch from GeoServer, while stats cost a full GEE computation — so when the
// quota is full, boundaries are evicted first, largest entry first.
function evictLargestGeoJsonEntry() {
  try {
    const storedJson = localStorage.getItem(CACHE_CONFIG.STORAGE_KEY_GEOJSON);
    if (!storedJson) return false;

    const allEntries = JSON.parse(storedJson);
    let largestKey = null;
    let largestSize = -1;
    for (const [entryKey, entry] of Object.entries(allEntries)) {
      const entrySize = JSON.stringify(entry).length;
      if (entrySize > largestSize) {
        largestKey = entryKey;
        largestSize = entrySize;
      }
    }
    if (largestKey === null) {
      localStorage.removeItem(CACHE_CONFIG.STORAGE_KEY_GEOJSON);
      return false;
    }

    delete allEntries[largestKey];
    localStorage.setItem(CACHE_CONFIG.STORAGE_KEY_GEOJSON, JSON.stringify(allEntries));
    return true;
  } catch {
    return false;
  }
}

// Bounded by eviction candidates: 1 prune pass + geojson entries + final write
const MAX_SAVE_ATTEMPTS = 20;

function saveCacheToStorage(swrCacheMap) {
  let entriesToStore;
  try {
    // Read existing storage first so already-stored entries keep their
    // original expiresAt; rewriting them would reset every entry's TTL to now
    entriesToStore = loadValidStoredEntries();
    const expirationTime = Date.now() + CACHE_CONFIG.STATS_TTL_MS;

    for (const [cacheKey, cacheState] of swrCacheMap.entries()) {
      if (!isPersistableEntry(cacheKey, cacheState)) continue;
      entriesToStore[cacheKey] = {
        data: cacheState.data,
        expiresAt: entriesToStore[cacheKey]?.expiresAt ?? expirationTime,
      };
    }
  } catch {
    return;
  }

  const serializedEntries = JSON.stringify(entriesToStore);
  let hasPrunedExpired = false;

  for (let attempt = 0; attempt < MAX_SAVE_ATTEMPTS; attempt++) {
    try {
      localStorage.setItem(CACHE_CONFIG.STORAGE_KEY_STATS, serializedEntries);
      return;
    } catch (error) {
      if (!isQuotaExceededError(error)) {
        console.warn('[statsCache] save failed:', error);
        return;
      }

      if (!hasPrunedExpired) {
        hasPrunedExpired = true;
        const prunedGee = pruneExpiredStoreEntries(CACHE_CONFIG.STORAGE_KEY_GEE);
        const prunedGeoJson = pruneExpiredStoreEntries(CACHE_CONFIG.STORAGE_KEY_GEOJSON);
        if (prunedGee || prunedGeoJson) continue;
      }

      if (!evictLargestGeoJsonEntry()) {
        console.warn('[statsCache] save failed: localStorage quota full, nothing left to evict');
        return;
      }
    }
  }
}

/**
 * SWR `provider` — restores persisted stats into the in-memory cache map on
 * startup, then persists write-through: as soon as a stats response settles
 * in the cache it is saved to localStorage. Unload events ('beforeunload',
 * 'pagehide') are deliberately not used — they don't fire reliably (mobile
 * kill, crash) and would leave the very first refresh uncached.
 */
export function statsCacheProvider() {
  const swrCacheMap = new Map();

  for (const [cacheKey, cacheEntry] of Object.entries(loadValidStoredEntries())) {
    swrCacheMap.set(cacheKey, { data: cacheEntry.data });
  }

  // SWR toggles cache state several times per request (isLoading/isValidating),
  // so coalesce bursts of set() calls into one localStorage write per tick
  const originalSet = swrCacheMap.set.bind(swrCacheMap);
  let savePending = false;
  swrCacheMap.set = (cacheKey, cacheState) => {
    const result = originalSet(cacheKey, cacheState);
    if (!savePending && isPersistableEntry(cacheKey, cacheState)) {
      savePending = true;
      setTimeout(() => {
        savePending = false;
        saveCacheToStorage(swrCacheMap);
      }, 0);
    }
    return result;
  };

  return swrCacheMap;
}
