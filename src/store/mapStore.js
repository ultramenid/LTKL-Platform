import { create } from 'zustand';
import { updateUrl } from '../utils/urlStateSync.js';
import { YEAR_CONFIG, CACHE_CONFIG } from '../config/constants.js';

// Global state: breadcrumbs, year, map instance, GEE & GeoJSON cache, pending requests
export const useMapStore = create((set, get) => ({
  // ─── Breadcrumb State ───
  breadcrumbs: {},
  selectedKab: null,

  // Update selected kabupaten (from sidebar list)
  setSelectedKab: (kabupatenName) => {
    set({ selectedKab: kabupatenName });
    const state = get();
    updateUrl(state.year, state.breadcrumbs, kabupatenName);
  },

  // ─── Year State ───
  year: YEAR_CONFIG.DEFAULT,
  setYear: (newYear) => {
    set({ year: newYear });
    const state = get();
    updateUrl(newYear, state.breadcrumbs, state.selectedKab);
  },

  // ─── Map Instance ───
  map: null,
  setMap: (mapInstance) => set({ map: mapInstance }),

  // ─── Breadcrumb Management ───
  // Replace entire breadcrumbs object (typically used from URL sync)
  setBreadcrumbs: (newBreadcrumbs) => set({ breadcrumbs: newBreadcrumbs }),

  // Update specific breadcrumb level + reset levels below to undefined
  updateBreadcrumb: (level, value) =>
    set((state) => {
      const newBreadcrumbs =
        level === 'home'
          ? {} // Reset all
          : level === 'kabupaten'
            ? { kab: value } // Reset kec & des
            : level === 'kecamatan'
              ? { kab: state.breadcrumbs.kab, kec: value } // Reset des
              : level === 'desa'
                ? {
                    kab: state.breadcrumbs.kab,
                    kec: state.breadcrumbs.kec,
                    des: value,
                  }
                : state.breadcrumbs;

      // Sync new state to URL query params
      updateUrl(state.year, newBreadcrumbs, state.selectedKab);

      return { breadcrumbs: newBreadcrumbs };
    }),

  // Reset all breadcrumbs to initial state
  resetBreadcrumbs: () =>
    set((state) => {
      updateUrl(state.year, {}, null);
      return { breadcrumbs: {}, selectedKab: null };
    }),

  // ─── GEE Cache (localStorage) ───
  // Stores Google Earth Engine tile URLs; format: {query_string: tile_url}
  geeCache: (() => {
    try {
      const storedJson = localStorage.getItem(CACHE_CONFIG.STORAGE_KEY_GEE);
      if (!storedJson) return {};

      const allCacheEntries = JSON.parse(storedJson);
      const currentTime = Date.now();

      // Remove expired entries on load
      const validCache = {};
      for (const [cacheKey, cacheEntry] of Object.entries(allCacheEntries)) {
        if (cacheEntry.expiresAt && cacheEntry.expiresAt > currentTime) {
          validCache[cacheKey] = cacheEntry.value;
        }
      }
      return validCache;
    } catch {
      // if localStorage errors, return empty object
      return {};
    }
  })(),

  setCacheGEE: (cacheKey, tileUrl) =>
    set((state) => {
      const expirationTime = Date.now() + CACHE_CONFIG.GEE_TTL_MS;
      const updatedCache = { ...state.geeCache };

      const storageFormat = {};
      for (const [key, value] of Object.entries(updatedCache)) {
        storageFormat[key] = { value, expiresAt: expirationTime };
      }
      storageFormat[cacheKey] = { value: tileUrl, expiresAt: expirationTime };

      try {
        localStorage.setItem(CACHE_CONFIG.STORAGE_KEY_GEE, JSON.stringify(storageFormat));
      } catch {
        // Silently ignore localStorage errors (quota exceeded, etc)
      }

      updatedCache[cacheKey] = tileUrl;
      return { geeCache: updatedCache };
    }),

  getCacheGEE: (cacheKey) => {
    const cachedTileUrl = get().geeCache[cacheKey];
    return cachedTileUrl;
  },

  // Remove a single GEE cache entry (called when URL expires during validation)
  clearCacheGEE: (cacheKey) =>
    set((state) => {
      const updatedCache = { ...state.geeCache };
      delete updatedCache[cacheKey];

      // Remove from localStorage (delete specific key, don't touch other entries)
      try {
        const storedJson = localStorage.getItem(CACHE_CONFIG.STORAGE_KEY_GEE);
        if (storedJson) {
          const storageEntries = JSON.parse(storedJson);
          delete storageEntries[cacheKey];
          localStorage.setItem(CACHE_CONFIG.STORAGE_KEY_GEE, JSON.stringify(storageEntries));
        }
      } catch {
        // Silently ignore localStorage errors
      }

      return { geeCache: updatedCache };
    }),

  // ─── GeoJSON Cache (localStorage) ───
  // Stores GeoJSON features from GeoServer; format: {layer_name_filter: geojson_object}
  geoJsonCache: (() => {
    try {
      const storedJson = localStorage.getItem(CACHE_CONFIG.STORAGE_KEY_GEOJSON);
      if (!storedJson) return {};

      const allCacheEntries = JSON.parse(storedJson);
      const currentTime = Date.now();

      // Remove expired entries on load
      const validCache = {};
      for (const [cacheKey, cacheEntry] of Object.entries(allCacheEntries)) {
        if (cacheEntry.expiresAt && cacheEntry.expiresAt > currentTime) {
          validCache[cacheKey] = cacheEntry.value;
        }
      }
      return validCache;
    } catch {
      // if localStorage errors, return empty object
      return {};
    }
  })(),

  setCacheGeoJSON: (cacheKey, geoJsonData) =>
    set((state) => {
      const expirationTime = Date.now() + CACHE_CONFIG.GEOJSON_TTL_MS;
      const updatedCache = { ...state.geoJsonCache };

      const storageFormat = {};
      for (const [key, value] of Object.entries(updatedCache)) {
        storageFormat[key] = { value, expiresAt: expirationTime };
      }
      storageFormat[cacheKey] = { value: geoJsonData, expiresAt: expirationTime };

      try {
        localStorage.setItem(CACHE_CONFIG.STORAGE_KEY_GEOJSON, JSON.stringify(storageFormat));
      } catch {
        // Silently ignore localStorage errors (quota exceeded, etc)
      }

      updatedCache[cacheKey] = geoJsonData;
      return { geoJsonCache: updatedCache };
    }),

  getCacheGeoJSON: (cacheKey) => {
    const cachedGeoJson = get().geoJsonCache[cacheKey];
    return cachedGeoJson;
  },

  // Clear all cache (memory + localStorage)
  clearCache: () => {
    try {
      localStorage.removeItem(CACHE_CONFIG.STORAGE_KEY_GEE);
      localStorage.removeItem(CACHE_CONFIG.STORAGE_KEY_GEOJSON);
    } catch {
      // Silently ignore localStorage errors
    }
    set({ geeCache: {}, geoJsonCache: {} });
  },

  // ─── Pending Requests (dedup) ───
  // Track in-flight requests for dedup — same requests share one promise
  pendingRequests: {},

  setPending: (requestKey, requestPromise) =>
    set((state) => ({
      pendingRequests: { ...state.pendingRequests, [requestKey]: requestPromise },
    })),

  getPending: (requestKey) => get().pendingRequests[requestKey],

  clearPending: (requestKey) =>
    set((state) => ({
      pendingRequests: Object.fromEntries(
        Object.entries(state.pendingRequests).filter(([key]) => key !== requestKey),
      ),
    })),

  // Clear all pending requests at once (used when AbortController is reset)
  clearAllPending: () => set({ pendingRequests: {} }),
}));
