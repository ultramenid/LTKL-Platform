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
│   ├── BreadCrumbs.jsx          # Navigasi trail
│   ├── CoverageChart.jsx         # Chart visualisasi coverage
│   ├── KabupatesList.jsx         # Daftar kabupaten
│   ├── LeftPanel.jsx             # Panel kiri (sidebar)
│   ├── Map.jsx                   # Komponen peta utama
│   ├── MapLayout.jsx             # Layout wrapper
│   ├── RightPanel.jsx            # Panel kanan (info)
│   └── TimeSelector.jsx          # Selector tahun
├── store/
│   ├── mapStore.js               # Global state + caching logic
│   └── mapLayerStore.js          # Layer management + GEE/GeoJSON loading
├── utils/
│   ├── mapDrilldown.js           # Drill-down logic
│   └── mapUtils.js               # Helper functions
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

| Komponen        | Fungsi                                      |
| --------------- | ------------------------------------------- |
| `MapLayout`     | Container utama, layout flex                |
| `LeftPanel`     | Sidebar dengan KabupatesList + TimeSelector |
| `Map`           | MapLibre instance dengan event handlers     |
| `RightPanel`    | Info panel + CoverageChart                  |
| `BreadCrumbs`   | Navigation trail + level navigation         |
| `CoverageChart` | ECharts visualization for coverage          |
| `TimeSelector`  | Dropdown untuk pilih tahun                  |
| `KabupatesList` | List kabupaten dengan onClick handlers      |

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

- **Variable Naming**: Meaningful names (no single letters except loop indices)
- **Comments**: 100% Bahasa Indonesia untuk maintainability
- **Error Handling**: Try-catch untuk localStorage, API calls, dan cleanup
- **Performance**: Cache-first strategy, request deduplication, lazy loading

## 🐛 Known Limitations

- localStorage limit (~5-10MB) - Future: Redis integration
- Offline mode: Works partially (cached data only)
- Concurrent filter changes: Sequential processing (by design)

## 🚀 Future Enhancements

- [ ] Redis integration untuk shared server-side cache
- [ ] Offline mode dengan Service Workers
- [ ] Data export (PDF, GeoJSON)
- [ ] Analysis tools (polygon intersection, area calculation)
- [ ] User authentication & role-based data access
- [ ] Real-time data updates

## 📄 License

TBD

## 👤 Author

- **Project**: Multi-layer mapping dengan GEE integration
- **Last Updated**: February 2026

## 📞 Support

Untuk questions atau issues, silakan open issue di repository.
