import { create } from "zustand";

export const useMapStore = create((set, get) => ({
  breadcrumbs: {},
  selectedKab: null,
  setSelectedKab: (kab) => set({ selectedKab: kab }),

  // Selector tahun global
  year: 2024,
  setYear: (year) => {
    set({ year });
    // Cache dipertahankan untuk semua tahun (cache key sudah include tahun)
  },

  map: null,
  setMap: (map) => set({ map }),
  
  // Breadcrumbs
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

  // Update level spesifik di breadcrumbs
  updateBreadcrumb: (level, value) =>
    set((state) => ({
      breadcrumbs:
        level === "home"
          ? {}
          : level === "kabupaten"
          ? { kab: value }
          : level === "kecamatan"
          ? { kab: state.breadcrumbs.kab, kec: value }
          : level === "desa"
          ? {
              kab: state.breadcrumbs.kab,
              kec: state.breadcrumbs.kec,
              des: value,
            }
          : state.breadcrumbs,
    })),

  // Reset semua breadcrumbs
  resetBreadcrumbs: () => set({ breadcrumbs: {} }),

  // Konstanta TTL (2 hari dalam millisecond)
  CACHE_TTL: 2 * 24 * 60 * 60 * 1000,

  // Simpan dan ambil cache untuk GEE tiles (persist ke localStorage, TTL 2 hari)
  geeCache: (() => {
    try {
      const stored = localStorage.getItem('mapCache_gee');
      if (!stored) return {};
      const cache = JSON.parse(stored);
      const now = Date.now();
      // Filter expired cache
      const validCache = {};
      for (const [key, entry] of Object.entries(cache)) {
        if (entry.expiresAt && entry.expiresAt > now) {
          validCache[key] = entry.value;
        }
      }
      return validCache;
    } catch {
      return {};
    }
  })(),
  setCacheGEE: (key, value) => set((state) => {
    const expiresAt = Date.now() + state.CACHE_TTL;
    const newCache = { ...state.geeCache };
    const storedCache = {};
    // Rebuild stored format dengan timestamp
    for (const [cacheKey, cacheValue] of Object.entries(newCache)) {
      storedCache[cacheKey] = { value: cacheValue, expiresAt: expiresAt };
    }
    storedCache[key] = { value, expiresAt };
    
    try {
      localStorage.setItem('mapCache_gee', JSON.stringify(storedCache));
    } catch {
      // Abaikan error localStorage (quota exceeded, etc)
    }
    newCache[key] = value;
    return { geeCache: newCache };
  }),
  getCacheGEE: (key) => {
    const cached = get().geeCache[key];
    return cached; // Sudah di-filter saat load
  },

  // Simpan dan ambil cache untuk GeoJSON (persist ke localStorage, TTL 2 hari)
  geoJsonCache: (() => {
    try {
      const stored = localStorage.getItem('mapCache_geojson');
      if (!stored) return {};
      const cache = JSON.parse(stored);
      const now = Date.now();
      // Filter expired cache
      const validCache = {};
      for (const [key, entry] of Object.entries(cache)) {
        if (entry.expiresAt && entry.expiresAt > now) {
          validCache[key] = entry.value;
        }
      }
      return validCache;
    } catch {
      return {};
    }
  })(),
  setCacheGeoJSON: (key, value) => set((state) => {
    const expiresAt = Date.now() + state.CACHE_TTL;
    const newCache = { ...state.geoJsonCache };
    const storedCache = {};
    // Rebuild stored format dengan timestamp
    for (const [cacheKey, cacheValue] of Object.entries(newCache)) {
      storedCache[cacheKey] = { value: cacheValue, expiresAt: expiresAt };
    }
    storedCache[key] = { value, expiresAt };
    
    try {
      localStorage.setItem('mapCache_geojson', JSON.stringify(storedCache));
    } catch {
      // Abaikan error localStorage (quota exceeded, etc)
    }
    newCache[key] = value;
    return { geoJsonCache: newCache };
  }),
  getCacheGeoJSON: (key) => {
    const cached = get().geoJsonCache[key];
    return cached; // Sudah di-filter saat load
  },

  // Clear semua cache (termasuk localStorage)
  clearCache: () => {
    try {
      localStorage.removeItem('mapCache_gee');
      localStorage.removeItem('mapCache_geojson');
    } catch {
      // Abaikan error localStorage
    }
    set({ geeCache: {}, geoJsonCache: {} });
  },

  // Track pending requests agar tidak double-fetch
  pendingRequests: {},
  setPending: (key, promise) => set((state) => ({
    pendingRequests: { ...state.pendingRequests, [key]: promise }
  })),
  getPending: (key) => get().pendingRequests[key],
  clearPending: (key) => set((state) => ({
    pendingRequests: Object.fromEntries(
      Object.entries(state.pendingRequests).filter(([requestKey]) => requestKey !== key)
    )
  })),
}));
