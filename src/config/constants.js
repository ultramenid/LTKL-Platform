// All application constants in one file for easy maintenance
// If something needs changing (URL, color, layer name), edit everything here

// Map configuration (center, zoom, style URL)
export const MAP_CONFIG = {
  DEFAULT_CENTER: [120.216667, -1.5],
  DEFAULT_ZOOM: 4,
  MIN_ZOOM: 4,
  STYLE_URL: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  // Debounce for container-driven map.resize(); per-frame resizing during the
  // 300ms sidebar width animation flickers the GL canvas and raster layers
  RESIZE_DEBOUNCE_MS: 150,
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
  FOREST: '#1f8d49', // Formasi Hutan — matches stacked chart land-cover color
  FOREST_HOVER: '#2e9a5b', // Lighter forest green for hover state
};

// Valid year range for MapBiomas Indonesia Collection 4.1
export const MAPBIOMAS_YEAR_RANGE = {
  MIN: 1990,
  MAX: 2024,
};

// Shared ECharts typography & axis colors — mirrors Atelier Atlas tokens in App.css
export const CHART_STYLE = {
  FONT_SANS: "'Schibsted Grotesk', ui-sans-serif, sans-serif",
  AXIS_LABEL: '#a8a29e', // stone-400 — warm neutral instead of cool slate
  AXIS_LINE: '#e7e5e4', // stone-200
  SPLIT_LINE: '#f5f5f4', // stone-100
};

// Unified tooltip design tokens (Rantaipasok deep-teal style)
export const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15, 41, 39, 0.95)',
  borderColor: COLORS.PRIMARY,
  borderWidth: 1,
  textStyle: {
    color: '#f4f9f8',
    fontSize: 11,
    fontFamily: CHART_STYLE.FONT_SANS,
    lineHeight: 18,
  },
  extraCssText:
    "z-index: 9999; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4); border-radius: 0; font-family: 'Schibsted Grotesk', ui-sans-serif, sans-serif;",
};

/**
 * Build a complete ECharts tooltip option from the shared deep-teal tokens.
 * Spread `extra` on top; `extra.textStyle` is shallow-merged with the base.
 */
export function makeTooltipOption(extra = {}) {
  return {
    ...TOOLTIP_STYLE,
    ...extra,
    textStyle: {
      ...TOOLTIP_STYLE.textStyle,
      ...(extra.textStyle || {}),
    },
  };
}

// Cache configuration (TTL, localStorage keys)
export const CACHE_CONFIG = {
  // GEE auth token expires ~2h, cache 1.5h to avoid serving expired URLs
  GEE_TTL_MS: 1.5 * 60 * 60 * 1000,
  // GeoJSON boundaries rarely change, 2-day cache is efficient enough
  GEOJSON_TTL_MS: 2 * 24 * 60 * 60 * 1000,
  // Chart stats are historical LULC data (immutable per region/year),
  // but cap at 2 days in case the GEE assets are reprocessed
  STATS_TTL_MS: 2 * 24 * 60 * 60 * 1000,
  STORAGE_KEY_GEE: 'mapCache_gee',
  STORAGE_KEY_GEOJSON: 'mapCache_geojson',
  STORAGE_KEY_STATS: 'mapCache_stats',
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
