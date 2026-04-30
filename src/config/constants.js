// All application constants in one file for easy maintenance
// If something needs changing (URL, color, layer name), edit everything here

// Map configuration (center, zoom, style URL)
export const MAP_CONFIG = {
  DEFAULT_CENTER: [120.216667, -1.5],
  DEFAULT_ZOOM: 4,
  MIN_ZOOM: 4,
  STYLE_URL: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};

// External server URLs (GeoServer for WFS, GEE tile server)
// VITE_TILE_SERVER read from .env (dev) or .env.production (build)
export const API_ENDPOINTS = {
  GEOSERVER: 'https://aws.simontini.id/geoserver/ows',
  TILE_SERVER: import.meta.env.VITE_TILE_SERVER ?? 'http://localhost:8000/gee',
};

// Layer names from GeoServer (LTKL:kabupaten, etc)
export const LAYER_TYPES = {
  KABUPATEN: 'LTKL:kabupaten',
  KECAMATAN: 'LTKL:kecamatan',
  DESA: 'LTKL:desa',
};

// Layer IDs in MapLibre (for addLayer, getLayer, etc)
export const LAYER_IDS = {
  KABUPATEN_FILL: 'kabupaten-fill',
  KECAMATAN_FILL: 'kecamatan-fill',
  DESA_FILL: 'desa-fill',
  GEE_LAYER: 'gee-lulc-layer',
};

// Source IDs in MapLibre (for addSource, getSource, etc)
export const SOURCE_IDS = {
  KABUPATEN: 'kabupaten-src',
  KECAMATAN: 'kecamatan-src',
  DESA: 'desa-src',
  ZOOM_KABUPATEN: 'zoomkabupaten-src',
  ZOOM_KECAMATAN: 'zoomkecamatan-src',
  ZOOM_DESA: 'zoomdesa-src',
  GEE: 'gee-lulc',
};

// UI colors (highlight, border, background, etc)
export const COLORS = {
  HIGHLIGHT: '#27CBFC', // Bright blue - hover/selected state
  DEFAULT: 'white', // White - default border color
  TRANSPARENT: 'rgba(0,0,0,0)', // Transparent - for intentionally hidden elements
  PRIMARY: '#14b8a6', // Teal - primary brand color
  PRIMARY_DARK: '#115e59', // Dark teal
  PRIMARY_TEXT: '#0f766e', // Teal for text
  // Alpha variant — used for chart area-fill to avoid overpowering
  PRIMARY_ALPHA: 'rgba(20,184,166,0.15)', // Transparent teal for area fill
  HIGHLIGHT_ALPHA: 'rgba(39,203,252,0.15)', // Transparent blue for area fill
};

// Cache configuration (TTL, localStorage keys)
export const CACHE_CONFIG = {
  // GEE auth token expires ~2h, cache 1.5h to avoid serving expired URLs
  GEE_TTL_MS: 1.5 * 60 * 60 * 1000,
  // GeoJSON boundaries rarely change, 2-day cache is efficient enough
  GEOJSON_TTL_MS: 2 * 24 * 60 * 60 * 1000,
  STORAGE_KEY_GEE: 'mapCache_gee',
  STORAGE_KEY_GEOJSON: 'mapCache_geojson',
};

// Administrative level names
export const ADMIN_LEVELS = {
  KABUPATEN: 'kabupaten',
  KECAMATAN: 'kecamatan',
  DESA: 'desa',
};

// WFS (Web Feature Service) parameters for GeoServer
export const WFS_CONFIG = {
  SERVICE: 'WFS',
  VERSION: '2.0.0',
  REQUEST: 'GetFeature',
  OUTPUT_FORMAT: 'application/json',
};

// Year configuration (default, min, max)
export const YEAR_CONFIG = {
  DEFAULT: 2024,
  MIN: 1990,
  MAX: 2024,
};

export const PROFILE_HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&auto=format&fit=crop';

export const PROFILE_DOWNLOAD_DUMMY_FILES = [
  {
    id: 'district-profile-pdf',
    title: 'Profil Kabupaten (PDF)',
    description: 'Ringkasan indikator kependudukan, ekonomi, dan wilayah dalam format PDF.',
    category: 'document',
    size: '2.4 MB',
    updatedAt: '28 April 2026',
    downloadUrl: '#',
  },
  {
    id: 'lulc-statistics-csv',
    title: 'Statistik LULC (CSV)',
    description: 'Data tabel land use/land cover per tahun untuk kebutuhan analisis lanjutan.',
    category: 'dataset',
    size: '890 KB',
    updatedAt: '28 April 2026',
    downloadUrl: '#',
  },
  {
    id: 'administrative-boundary-geojson',
    title: 'Batas Administrasi (GeoJSON)',
    description: 'Berkas batas kabupaten, kecamatan, dan desa untuk kebutuhan pemetaan.',
    category: 'map',
    size: '5.1 MB',
    updatedAt: '28 April 2026',
    downloadUrl: '#',
  },
];
