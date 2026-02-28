import { create } from "zustand";
import { updateUrl } from "../utils/urlStateSync.js";
import { YEAR_CONFIG } from "../config/constants.js";

// Zustand store untuk manage map state global
// Bertanggung jawab untuk: breadcrumbs, selectedKab, year, map instance, cache (GEE + GeoJSON), pending requests
export const useMapStore = create((set, get) => ({
  // ═══════════════════ BREADCRUMB STATE ═══════════════════
  // Track user navigation: Indonesia → Kabupaten → Kecamatan → Desa
  // Format: {kab: 'Bantul', kec: 'Imogiri', des: 'Banyudono'}
  breadcrumbs: {},
  selectedKab: null,
  
  // Update kabupaten yang dipilih (dari sidebar list)
  setSelectedKab: (kabupatenName) => {
    set({ selectedKab: kabupatenName });
    const state = get();
    updateUrl(state.year, state.breadcrumbs, kabupatenName);
  },

  // ═══════════════════ YEAR STATE ═══════════════════
  // Global tahun untuk filter coverage GEE (shared ke semua layers)
  year: YEAR_CONFIG.DEFAULT,
  setYear: (newYear) => {
    set({ year: newYear });
    const state = get();
    updateUrl(newYear, state.breadcrumbs, state.selectedKab);
  },

  // ═══════════════════ MAP INSTANCE ═══════════════════
  // Store referensi ke MapLibre GL instance (untuk manipulasi map dari berbagai komponen)
  map: null,
  setMap: (mapInstance) => set({ map: mapInstance }),
  
  // ═══════════════════ BREADCRUMB MANAGEMENT ═══════════════════
  // Replace seluruh breadcrumbs object (biasa digunakan dari URL sync)
  setBreadcrumbs: (newBreadcrumbs) => set({ breadcrumbs: newBreadcrumbs }),

  // Update level spesifik di breadcrumbs (kabupaten, kecamatan, desa)
  // Otomatis update level di bawahnya ke undefined (reset)
  // Contoh: updateBreadcrumb("kecamatan", "Imogiri") 
  //   → {kab: (tetap), kec: "Imogiri", des: undefined}
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

  // ═══════════════════ CACHE CONFIGURATION ═══════════════════
  // Cache TTL: 2 hari (dalam millisecond)
  // Untuk performance: tidak fetch layer data / raster tiles yang sama 2x dalam 2 hari
  CACHE_TTL: 2 * 24 * 60 * 60 * 1000,

  // ═══════════════════ GEE RASTER CACHE (localStorage) ═══════════════════
  // Menyimpan Google Earth Engine tile URLs (LULC coverage)
  // Format: {query_string: tile_url, ...}
  // Menggunakan localStorage dengan TTL 2 hari untuk persist across sessions
  geeCache: (() => {
    try {
      const storedJson = localStorage.getItem('mapCache_gee');
      if (!storedJson) return {};
      
      const allCacheEntries = JSON.parse(storedJson);
      const currentTime = Date.now();
      
      // Filter out expired entries saat load (hanya keep yang belum expired)
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
    const expirationTime = Date.now() + state.CACHE_TTL;
    const updatedCache = { ...state.geeCache };
    
    // Rebuild localStorage format (dengan timestamp untuk setiap entry)
    const storageFormat = {};
    for (const [key, value] of Object.entries(updatedCache)) {
      storageFormat[key] = { value, expiresAt: expirationTime };
    }
    storageFormat[cacheKey] = { value: tileUrl, expiresAt: expirationTime };
    
    try {
      localStorage.setItem('mapCache_gee', JSON.stringify(storageFormat));
    } catch {
      // Abaikan error localStorage (quota exceeded, etc)
    }
    
    updatedCache[cacheKey] = tileUrl;
    return { geeCache: updatedCache };
  }),
  
  getCacheGEE: (cacheKey) => {
    const cachedTileUrl = get().geeCache[cacheKey];
    return cachedTileUrl; // Sudah di-filter saat initialization
  },

  // ═══════════════════ GEOJSON CACHE (localStorage) ═══════════════════
  // Menyimpan GeoJSON features dari GeoServer (administrative boundaries)
  // Format: {layer_name_filter: geojson_object, ...}
  // Menggunakan localStorage dengan TTL 2 hari untuk persist across sessions
  geoJsonCache: (() => {
    try {
      const storedJson = localStorage.getItem('mapCache_geojson');
      if (!storedJson) return {};
      
      const allCacheEntries = JSON.parse(storedJson);
      const currentTime = Date.now();
      
      // Filter out expired entries saat load
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
    const expirationTime = Date.now() + state.CACHE_TTL;
    const updatedCache = { ...state.geoJsonCache };
    
    // Rebuild localStorage format (dengan timestamp untuk setiap entry)
    const storageFormat = {};
    for (const [key, value] of Object.entries(updatedCache)) {
      storageFormat[key] = { value, expiresAt: expirationTime };
    }
    storageFormat[cacheKey] = { value: geoJsonData, expiresAt: expirationTime };
    
    try {
      localStorage.setItem('mapCache_geojson', JSON.stringify(storageFormat));
    } catch {
      // Abaikan error localStorage (quota exceeded, etc)
    }
    
    updatedCache[cacheKey] = geoJsonData;
    return { geoJsonCache: updatedCache };
  }),
  
  getCacheGeoJSON: (cacheKey) => {
    const cachedGeoJson = get().geoJsonCache[cacheKey];
    return cachedGeoJson; // Sudah di-filter saat initialization
  },

  // Clear seluruh cache (memory + localStorage)
  // Digunakan saat user click "Clear Cache" atau debugging
  clearCache: () => {
    try {
      localStorage.removeItem('mapCache_gee');
      localStorage.removeItem('mapCache_geojson');
    } catch {
      // Abaikan error localStorage
    }
    set({ geeCache: {}, geoJsonCache: {} });
  },

  // ═══════════════════ PENDING REQUESTS DEDUPLICATION ═══════════════════
  // Track requests yang sedang berlangsung agar tidak fetch 2x
  // Jika user click cepat-cepat atau component re-render, request yang sama
  // akan di-share (tunggu promise yang sama) daripada fetch ulang
  // Format: {request_key: promise, ...}
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
