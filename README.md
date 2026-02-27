# My MapLibre App

Aplikasi web interaktif untuk visualisasi data geografis dengan integrasi Google Earth Engine (GEE) dan GeoServer. Aplikasi ini memungkinkan pengguna menjelajahi data satelit dan administrasi geografis dengan fitur drilling down dari level kabupaten hingga desa.

## 🎯 Fitur Utama

- **Visualisasi Peta Interaktif**: Menggunakan MapLibre GL untuk display yang smooth dan responsif
- **Integrasi Google Earth Engine**: Menampilkan citra satelit dengan filter tahun dan area geografis
- **Data Administrasi**: Boundary polygon dari GeoServer untuk kabupaten, kecamatan, dan desa
- **Drill-Down Navigation**: Navigasi dari level kabupaten → kecamatan → desa dengan breadcrumb tracking
- **Intelligent Caching**:
  - Cache di memory (Zustand)
  - Persist ke localStorage
  - TTL 2 hari untuk auto-refresh data
  - Request deduplication untuk mencegah fetch redundan
- **Coverage Chart**: Visualisasi coverage area dengan ECharts
- **Responsive UI**: Tailwind CSS untuk styling yang clean dan responsive

## 🏗️ Tech Stack

| Layer                  | Technology        |
| ---------------------- | ----------------- |
| **Frontend Framework** | React 18 + Vite   |
| **State Management**   | Zustand           |
| **Mapping Library**    | MapLibre GL       |
| **Charting**           | ECharts for React |
| **Styling**            | Tailwind CSS      |
| **Build Tool**         | Vite              |
| **Linting**            | ESLint            |

## 📦 Dependensi Data

### Tile Server (GEE Imagery)

- **Endpoint**: `https://gee.simontini.id/gee`
- **Data**: Satellite imagery tiles dengan filter tahun dan lokasi
- **Caching**: 2 hari TTL dengan request deduplication

### GeoServer (Vector Boundaries)

- **Endpoint**: `https://aws.simontini.id/geoserver/ows`
- **Service**: WFS (Web Feature Service)
- **Data**: Polygon boundaries kabupaten, kecamatan, desa
- **Format**: GeoJSON
- **Caching**: 2 hari TTL dengan request deduplication

## 📁 Struktur Project

```
src/
├── components/
│   ├── BreadCrumbs.jsx          # Navigasi trail (Indonesia comments, meaningful names)
│   ├── CoverageChart.jsx         # Chart visualisasi coverage (full sections)
│   ├── KabupatesList.jsx         # Daftar kabupaten (handler dengan flow comments)
│   ├── LeftPanel.jsx             # Panel kiri + Logo sticky
│   ├── Map.jsx                   # Komponen peta utama (refs, state, handlers)
│   ├── MapLayout.jsx             # Layout wrapper dengan collapsible panels
│   ├── RightPanel.jsx            # Panel kanan (65% map, 35% charts)
│   └── TimeSelector.jsx          # Selector tahun dengan raster reload
├── config/
│   └── constants.js              # 60+ centralized constants (map, API, colors, etc)
├── data/
│   └── kabupatens.js             # Kabupaten reference data
├── store/
│   ├── mapStore.js               # Global state + caching (sections, meaningful names)
│   └── mapLayerStore.js          # Layer management (refactored 300+ lines)
├── utils/
│   ├── mapDrilldown.js           # Drill-down logic (LEVEL 1/2/3 comments)
│   ├── mapLoadingSetup.js        # Loading setup (kabupaten/kecamatan/desa flows)
│   ├── mapUtils.js               # Map helpers (extractCoordinates, fit bounds, zoom)
│   ├── filterBuilder.js          # CQL filter builders (newbie friendly)
│   ├── dataTransform.js          # Response normalization (3 transformers)
│   └── urlStateSync.js           # URL query param sync
├── App.jsx                        # Root component
├── main.jsx                       # Entry point
└── App.css                        # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm atau yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd my-maplibre-app

# Install dependencies
npm install

# Install MapLibre GL (jika belum)
npm install maplibre-gl
```

### Development

```bash
# Start dev server
npm run dev

# Open browser
# http://localhost:5173
```

### Build

```bash
# Production build
npm run build

# Preview build
npm run preview
```

## 🔄 State Management (Zustand)

### `mapStore.js`

Global state untuk map dan caching:

```javascript
// Cache GEE imagery
useMapStore.setCacheGEE(cacheKey, imageData);
useMapStore.getCacheGEE(cacheKey);

// Cache GeoJSON
useMapStore.setCacheGeoJSON(cacheKey, geoboundaryData);
useMapStore.getCacheGeoJSON(cacheKey);

// Breadcrumb navigation
useMapStore.updateBreadcrumb(level, value);

// Year selector
useMapStore.setYear(2024);
```

### `mapLayerStore.js`

Layer management:

```javascript
// Load GEE tiles dengan cache-first strategy
useMapLayerStore.loadGEEPolygonRaster(year, filters);

// Load GeoJSON dari GeoServer dengan cache-first strategy
useMapLayerStore.loadLayer(layerName, filters);

// Remove layers dan cleanup
useMapLayerStore.removeLayer(layerId);
```

## 💾 Caching Strategy

### Multi-Layer Cache

1. **In-Memory Cache (Zustand)**
   - Fastest access (dalam session)
   - Lost on page refresh

2. **localStorage Persistence**
   - Survives page reload
   - ~5-10MB limit per browser
   - Keys: `mapCache_gee`, `mapCache_geojson`

3. **TTL Expiration**
   - 2 hari (172,800,000 ms)
   - Auto-filter expired entries saat app load
   - Timestamp stored: `{value: data, expiresAt: timestamp}`

4. **Request Deduplication**
   - Track pending requests
   - Prevent duplicate API calls
   - Returned promise shared ke multiple callers

### Cache Key Format

```
gee_year=2024&kab=Bantul&kec=Kraton
geojson_kab=Bantul
geojson_kec=Kraton&kab=Bantul
```

## 📊 Data Flow

```
User Interaction (TimeSelector/Map Click)
        ↓
updateBreadcrumb() / setYear()
        ↓
loadGEEPolygonRaster() / loadLayer()
        ↓
Check Cache (Zustand) → Hit? Return cached data
        ↓
Check localStorage → Valid & not expired? Load to Zustand
        ↓
Check pending request → Fetch in progress? Wait for promise
        ↓
Fetch from API → Save to Zustand + localStorage → Return Promise
        ↓
Map layer updated → User sees changes
```

## 🎨 UI Components Breakdown

| Komponen        | Fungsi & Fitur                               |
| --------------- | -------------------------------------------- |
| `MapLayout`     | Container utama, layout dengan toggle panels |
| `LeftPanel`     | Sidebar: Logo LTKL + KabupatesList (drill)   |
| `Map`           | MapLibre GL (refs, state, handlers sections) |
| `RightPanel`    | Split: 65% Map, 35% Charts (scrollable)      |
| `BreadCrumbs`   | Trail, home reset, level navigation          |
| `CoverageChart` | ECharts bar chart (area per kabupaten)       |
| `TimeSelector`  | Timeline dots untuk year selection + reload  |
| `KabupatesList` | List kabupaten dengan drill-down + zoom      |

## 🔧 Important Fixes & Optimizations

### Layer Removal Order (Critical)

```javascript
// ✅ Correct order (prevents source removal errors)
1. Remove hover line layer
2. Remove main polygon layer
3. Remove source

// ❌ Wrong order would cause:
// "Source cannot be removed while layer is using it"
```

### Event Handler Safety

```javascript
// ✅ Always check source existence before setFeatureState
if (map.getSource(sourceId)) {
  map.setFeatureState(...)
}
```

### Map Cleanup

```javascript
// ✅ Proper cleanup on unmount
try {
  map.remove();
} catch (error) {
  console.error("Map cleanup error:", error);
}
```

## 📝 Code Quality Standards

**Development Rules Applied (Session 7):**

1. **Newbie Friendly & Reusable Code** ✅
   - Clear variable names (no `a`, `b`, `x`, `data`)
   - Functions properly exported and composable
   - No hardcoding - all constants dari `src/config/constants.js`
   - Example: `fid` → `featureId`, `kabName` → `kabupatenName`

2. **Indonesian Comments** ✅
   - 100% Bahasa Indonesia untuk maintainability
   - Simple, natural style (bukan AI-generated JSDoc)
   - Section dividers dengan `─── SECTION ───`
   - Example: comments di mapLayerStore.js, CoverageChart.jsx

3. **Meaningful Variable Names** ✅
   - Descriptive naming everywhere
   - Function names clearly state purpose
   - No abbreviations (res → response, json → parsedJson)
   - Include type hints in names (geeCache, geoJsonCache, etc)

**Technical Standards:**

- **Error Handling**: Try-catch untuk localStorage, API calls, cleanup
- **Performance**: Cache-first strategy, request deduplication, lazy loading
- **Code Organization**: Section dividers, clear flow documentation
- **Build**: 661 modules, 0 errors, ~4.2s build time

## � Helper Utilities

### `src/utils/filterBuilder.js` - CQL Filter Builders

```javascript
// Build single condition filter
const filter = buildSingleFilter("kab", "Bantul");
// Output: "kab='Bantul'"

// Build multi-condition filter
const multiFiler = buildMultiFilter({ kab: "Bantul", kec: "Imogiri" });
// Output: "kab='Bantul' AND kec='Imogiri'"
```

### `src/utils/dataTransform.js` - Data Transformers

```javascript
// Normalize berbagai format server response
const normalized = normalizeServerResponse(serverData);

// Transform untuk chart display
const chartData = transformDataForChart(normalizedData);
```

### `src/config/constants.js` - Centralized Configuration

```javascript
// 60+ constants terorganisir:
(MAP_CONFIG,
  API_ENDPOINTS,
  LAYER_TYPES,
  LAYER_IDS,
  SOURCE_IDS,
  COLORS,
  CACHE_CONFIG,
  ADMIN_LEVELS,
  WFS_CONFIG,
  YEAR_CONFIG);
```

## �🐛 Known Limitations

- localStorage limit (~5-10MB) - Future: Redis integration
- Offline mode: Works partially (cached data only)
- Concurrent filter changes: Sequential processing (by design)

## 🎯 Refactoring Session 7 Summary

**13 files refactored** dengan improvements:

- 50+ variable renames untuk clarity
- 100+ comment improvements dengan Indonesian explanations
- 50+ section dividers untuk better code organization
- Major refactoring: mapLayerStore.js, CoverageChart.jsx, mapStore.js

Dokumentasi lengkap: [REFACTOR_SESSION_7_SUMMARY.md](REFACTOR_SESSION_7_SUMMARY.md)

## 🚀 Future Enhancements

- [ ] Extract cache logic ke `src/utils/cacheUtils.js` (shared utilities)
- [ ] Extract layer creation helpers (fill + hover layer pattern)
- [ ] Redis integration untuk shared server-side cache
- [ ] Offline mode dengan Service Workers
- [ ] Data export (PDF, GeoJSON)
- [ ] Analysis tools (polygon intersection, area calculation)
- [ ] User authentication & role-based data access
- [ ] Real-time data updates
- [ ] JSDoc type annotations untuk IDE support
- [ ] Unit tests untuk cache handling & data transformation

## 📄 License

TBD

## 👤 Author

- **Project**: Multi-layer mapping dengan GEE integration
- **Last Updated**: February 2026

## 📞 Support

Untuk questions atau issues, silakan open issue di repository.
