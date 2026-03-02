import { create } from "zustand";
import { updateUrl } from "../utils/urlStateSync.js";
import { YEAR_CONFIG, CACHE_CONFIG } from "../config/constants.js";

// Global state: breadcrumbs, tahun, map instance, cache GEE & GeoJSON, pending requests
export const useMapStore = create((set, get) => ({
  // ─── Breadcrumb State ───
  breadcrumbs: {},
  selectedKab: null,
  
  // Update kabupaten yang dipilih (dari sidebar list)
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
  // Replace seluruh breadcrumbs object (biasa digunakan dari URL sync)
  setBreadcrumbs: (newBreadcrumbs) => set({ breadcrumbs: newBreadcrumbs }),

  // Update level spesifik di breadcrumbs + reset level di bawahnya ke undefined
  updateBreadcrumb: (level, value) =>
    set((state) => {
      const newBreadcrumbs =
        level === "home"
          ? {} // Reset semua
          : level === "kabupaten"
          ? { kab: value } // Reset kec & des
          : level === "kecamatan"
          ? { kab: state.breadcrumbs.kab, kec: value } // Reset des
          : level === "desa"
          ? {
              kab: state.breadcrumbs.kab,
              kec: state.breadcrumbs.kec,
              des: value,
            }
          : state.breadcrumbs;

      // Sync state baru ke URL query params
      updateUrl(state.year, newBreadcrumbs, state.selectedKab);

      return { breadcrumbs: newBreadcrumbs };
    }),

  // Reset semua breadcrumbs ke initial state
  resetBreadcrumbs: () =>
    set((state) => {
      updateUrl(state.year, {}, null);
      return { breadcrumbs: {}, selectedKab: null };
    }),

  // ─── GEE Cache (localStorage) ───
  // Menyimpan Google Earth Engine tile URLs; format: {query_string: tile_url}
  geeCache: (() => {
    try {
      const storedJson = localStorage.getItem(CACHE_CONFIG.STORAGE_KEY_GEE);
      if (!storedJson) return {};
      
      const allCacheEntries = JSON.parse(storedJson);
      const currentTime = Date.now();
      
      // Buang expired entries saat load
      const validCache = {};
      for (const [cacheKey, cacheEntry] of Object.entries(allCacheEntries)) {
        if (cacheEntry.expiresAt && cacheEntry.expiresAt > currentTime) {
          validCache[cacheKey] = cacheEntry.value;
        }
      }
      return validCache;
    } catch {
      // jika localStorage error, return empty object
      return {};
    }
  })(),
  
  setCacheGEE: (cacheKey, tileUrl) => set((state) => {
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
      // Abaikan error localStorage (quota exceeded, etc)
    }
    
    updatedCache[cacheKey] = tileUrl;
    return { geeCache: updatedCache };
  }),
  
  getCacheGEE: (cacheKey) => {
    const cachedTileUrl = get().geeCache[cacheKey];
    return cachedTileUrl;
  },

  // Hapus satu GEE cache entry (dipanggil saat URL expired saat validasi)
  clearCacheGEE: (cacheKey) => set((state) => {
    const updatedCache = { ...state.geeCache };
    delete updatedCache[cacheKey];

    // Hapus dari localStorage (delete key spesifik, jangan ganggu entry lain)
    try {
      const storedJson = localStorage.getItem(CACHE_CONFIG.STORAGE_KEY_GEE);
      if (storedJson) {
        const storageEntries = JSON.parse(storedJson);
        delete storageEntries[cacheKey];
        localStorage.setItem(CACHE_CONFIG.STORAGE_KEY_GEE, JSON.stringify(storageEntries));
      }
    } catch {
      // Abaikan error localStorage
    }

    return { geeCache: updatedCache };
  }),

  // ─── GeoJSON Cache (localStorage) ───
  // Menyimpan GeoJSON features dari GeoServer; format: {layer_name_filter: geojson_object}
  geoJsonCache: (() => {
    try {
      const storedJson = localStorage.getItem(CACHE_CONFIG.STORAGE_KEY_GEOJSON);
      if (!storedJson) return {};
      
      const allCacheEntries = JSON.parse(storedJson);
      const currentTime = Date.now();
      
      // Buang expired entries saat load
      const validCache = {};
      for (const [cacheKey, cacheEntry] of Object.entries(allCacheEntries)) {
        if (cacheEntry.expiresAt && cacheEntry.expiresAt > currentTime) {
          validCache[cacheKey] = cacheEntry.value;
        }
      }
      return validCache;
    } catch {
      // jika localStorage error, return empty object
      return {};
    }
  })(),
  
  setCacheGeoJSON: (cacheKey, geoJsonData) => set((state) => {
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
      // Abaikan error localStorage (quota exceeded, etc)
    }
    
    updatedCache[cacheKey] = geoJsonData;
    return { geoJsonCache: updatedCache };
  }),
  
  getCacheGeoJSON: (cacheKey) => {
    const cachedGeoJson = get().geoJsonCache[cacheKey];
    return cachedGeoJson;
  },

  // Bersihkan semua cache (memory + localStorage)
  clearCache: () => {
    try {
      localStorage.removeItem(CACHE_CONFIG.STORAGE_KEY_GEE);
      localStorage.removeItem(CACHE_CONFIG.STORAGE_KEY_GEOJSON);
    } catch {
      // Abaikan error localStorage
    }
    set({ geeCache: {}, geoJsonCache: {} });
  },

  // ─── Pending Requests ───
  // Track in-flight requests untuk dedup — request yang sama share satu promise
  pendingRequests: {},
  
  setPending: (requestKey, requestPromise) => set((state) => ({
    pendingRequests: { ...state.pendingRequests, [requestKey]: requestPromise }
  })),
  
  getPending: (requestKey) => get().pendingRequests[requestKey],
  
  clearPending: (requestKey) => set((state) => ({
    pendingRequests: Object.fromEntries(
      Object.entries(state.pendingRequests).filter(([key]) => key !== requestKey)
    )
  })),

  // Hapus semua pending requests sekaligus (dipakai saat AbortController di-reset)
  clearAllPending: () => set({ pendingRequests: {} }),
}));
