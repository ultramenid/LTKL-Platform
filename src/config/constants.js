// filepath: src/config/constants.js
// Semua konstanta aplikasi dalam satu file untuk mudah di-maintain
// Jika ada yang perlu diubah (URL, color, layer name), edit semuanya di sini

// Konfigurasi map (center, zoom, style URL)
export const MAP_CONFIG = {
  DEFAULT_CENTER: [120.216667, -1.5],
  DEFAULT_ZOOM: 4,
  MIN_ZOOM: 4,
  STYLE_URL: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};

// URL server eksternal (GeoServer untuk WFS, GEE tile server)
export const API_ENDPOINTS = {
  GEOSERVER: 'https://aws.simontini.id/geoserver/ows',
  TILE_SERVER: 'https://gee.simontini.id/gee',
};

// Nama layer dari GeoServer (LTKL:kabupaten, dll)
export const LAYER_TYPES = {
  KABUPATEN: 'LTKL:kabupaten',
  KECAMATAN: 'LTKL:kecamatan',
  DESA: 'LTKL:desa',
};

// ID layer di MapLibre (untuk addLayer, getLayer, dll)
export const LAYER_IDS = {
  KABUPATEN_FILL: 'kabupaten-fill',
  KECAMATAN_FILL: 'kecamatan-fill',
  DESA_FILL: 'desa-fill',
  GEE_LAYER: 'gee-lulc-layer',
};

// ID source di MapLibre (untuk addSource, getSource, dll)
export const SOURCE_IDS = {
  KABUPATEN: 'kabupaten-src',
  KECAMATAN: 'kecamatan-src',
  DESA: 'desa-src',
  ZOOM_KABUPATEN: 'zoomkabupaten-src',
  ZOOM_KECAMATAN: 'zoomkecamatan-src',
  ZOOM_DESA: 'zoomdesa-src',
  GEE: 'gee-lulc',
};

// Warna untuk UI (highlight, border, background, dll)
export const COLORS = {
  HIGHLIGHT: '#27CBFC',       // Biru terang - saat hover/selected
  DEFAULT: 'white',            // Putih - default border color
  TRANSPARENT: 'rgba(0,0,0,0)', // Transparan - untuk hidden elements
  PRIMARY: '#14b8a6',          // Teal - primary color
  PRIMARY_DARK: '#115e59',     // Teal gelap
  PRIMARY_TEXT: '#0f766e',     // Teal untuk text
};

// Konfigurasi cache (berapa lama data disimpan, key untuk localStorage)
export const CACHE_CONFIG = {
  TTL_MS: 2 * 24 * 60 * 60 * 1000, // Simpan data 2 hari
  STORAGE_KEY_GEE: 'mapCache_gee',
  STORAGE_KEY_GEOJSON: 'mapCache_geojson',
};

// Nama-nama level administratif (Indonesia: kabupaten, kecamatan, desa)
export const ADMIN_LEVELS = {
  KABUPATEN: 'kabupaten',
  KECAMATAN: 'kecamatan',
  DESA: 'desa',
};

// Parameter WFS (Web Feature Service) untuk GeoServer
export const WFS_CONFIG = {
  SERVICE: 'WFS',
  VERSION: '2.0.0',
  REQUEST: 'GetFeature',
  OUTPUT_FORMAT: 'application/json',
};

// Konfigurasi UI (posisi elemen, animasi, durasi)
export const UI_CONFIG = {
  BREADCRUMB_POSITION: { top: 8, left: 8 }, // pixel dari corner
  TIME_SELECTOR_POSITION: { bottom: 16, left: 16 },
  TOOLTIP_ANIMATION: 'fadeIn',
  TRANSITION_DURATION_MS: 300,
};

// Konfigurasi tahun (default, min, max)
export const YEAR_CONFIG = {
  DEFAULT: 2024,
  MIN: 1990,
  MAX: 2024,
};
