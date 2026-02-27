// ARCHITECTURE_GUIDE.md

# Panduan Arsitektur untuk Developer Baru

Dokumentasi ini menjelaskan struktur dan flow aplikasi secara menyeluruh.

## 🏗️ Struktur Folder

```
src/
├── components/          → React components untuk UI
├── store/              → State management (Zustand)
├── utils/              → Helper functions & business logic
├── config/             → Configuration & constants
├── data/               → Static data (kabupatens.js)
└── assets/             → Images, icons, etc
```

## 🔄 Data Flow

### 1. **User Opens App dengan URL Parameter**

```
URL: ?year=2024&administrasi=kab:Sintang&selectedKab=Sintang
     ↓
App.jsx → parseUrlState()
     ↓
Restore ke useMapStore
     ↓
Map component menjadi ready (isMapReady = true)
     ↓
useEffect dependency [breadcrumbs, isMapReady] trigger
     ↓
Load levels (loadLevelLayers / loadDesaLevel)
```

### 2. **User Click Layer di Map**

```
User click kabupaten
     ↓
attachLayerInteraction → click handler
     ↓
updateBreadcrumb() di store
     ↓
handleBreadcrumbDrill() execute
     ↓
Load zoom layer → wait source → zoom → load GEE → load next level
```

### 3. **User Change Year**

```
TimeSelector → setYear()
     ↓
updateUrl() (keep URL sync)
     ↓
loadGEEPolygonRaster() dengan filter baru
```

## 📦 Key Modules Dijelaskan

### **src/config/constants.js** (NEW!)

Terpusat untuk semua magic numbers & strings:

- MAP_CONFIG: Center, zoom, style URL
- API_ENDPOINTS: GeoServer & Tile Server URLs
- LAYER_TYPES: WFS layer names (LTKL:kabupaten, etc)
- LAYER_IDS: MapLibre layer IDs (kabupaten-fill, etc)
- COLORS: All colors used in app
- CACHE_CONFIG: TTL & localStorage keys

**Mengapa penting:** Jika perlu ganti URL atau layer name, cukup ubah satu tempat!

### **src/utils/filterBuilder.js** (NEW!)

Helper untuk build CQL filters dengan clean:

```javascript
// Sebelum (messy)
const filter = `kab='${kab}' AND kec='${kec}'`;

// Sesudah (clear intent)
const filter = buildKecamatanFilter({ kab, kec });
```

### **src/store/mapStore.js**

Global state untuk:

- `breadcrumbs` - Current drill level (kab/kec/des)
- `year` - Selected year
- `selectedKab` - Current kabupaten selection
- `geeCache` - Cache GEE tiles (in-memory + localStorage)
- `geoJsonCache` - Cache GeoJSON boundaries
- `pendingRequests` - Track in-progress requests (prevent double-fetch)

### **src/store/mapLayerStore.js**

Layer management - loads & manages MapLibre layers:

- `loadGEEPolygonRaster()` - Load satellite imagery
- `loadLayer()` - Load vector boundaries (WFS)
- `removeLayerAndSource()` - Cleanup
- `attachLayerInteraction()` - Add click/hover handlers

### **src/utils/mapDrilldown.js**

Business logic untuk drill operations:

- `handleBreadcrumbDrill()` - User click breadcrumb (navigate up/down)
- `handleHomeReset()` - Reset ke kabupaten default

### **src/utils/mapLoadingSetup.js**

Load dari URL parameters:

- `loadLevelLayers()` - Auto-load saat app start dengan URL params
- `loadDesaLevel()` - Khusus desa (no zoom layer)

### **src/utils/mapUtils.js**

Pure utility functions:

- `waitForSourceData()` - Event listener untuk source ready (better than setTimeout!)
- `zoomToFeature()` - Zoom ke feature boundary
- `zoomToMatchingFeature()` - Find & zoom ke feature by property

### **src/utils/urlStateSync.js**

URL ↔ State synchronization:

- `parseUrlState()` - Extract params dari URL
- `generateUrl()` - Build URL dari state
- `updateUrl()` - Update history (no page reload)
- `encodeAdministrasi()` / `decodeAdministrasi()` - Encode breadcrumbs

## 🚨 Important Patterns

### **1. Event-Driven Waits (bukan hardcoded delays)**

❌ **OLD:**

```javascript
await new Promise((resolve) => setTimeout(resolve, 200));
```

✅ **NEW:**

```javascript
await waitForSourceData(map, sourceId);
```

**Why?** Runs faster on fast connections, more reliable than guessing timing.

### **2. Cache-First Strategy**

```
Check in-memory cache → Check localStorage → Check pending request → Fetch from API
```

Ini makes app fast dan sustainable!

### **3. Two useEffect Pattern in Map.jsx**

```javascript
// Effect 1: Initialize map ONCE
useEffect(() => {
  // Create map instance
  map.on("load", () => setIsMapReady(true));
}, [setMap]);

// Effect 2: Load layers when breadcrumbs CHANGE
useEffect(() => {
  if (!isMapReady) return;
  loadLayers();
}, [breadcrumbs, isMapReady]); // Triggers on state change
```

**Why?** Separates initialization from data loading. Fixes race conditions!

### **4. Layer Removal Order**

```javascript
// ✅ Correct order (important!)
1. Remove hover line layer
2. Remove main polygon layer
3. Remove source

// ❌ Wrong order = error!
// "Source cannot be removed while layer is using it"
```

## 🔍 Understanding Component Hierarchy

```
App.jsx
  ├─ LeftPanel
  │   └─ KabupatesList
  │        └─ onClick → handleKabupatenClick
  │             └─ loadLayer + loadGEE + removeLayerAndSource
  │
  └─ RightPanel
      ├─ Map
      │   ├─ uses: breadcrumbs, isMapReady from store
      │   ├─ loads: loadLevelLayers / loadDesaLevel
      │   └─ handles: BreadcrumbsComponent clicks
      │
      └─ CoverageChart
          └─ reads: year from store
              └─ fetches: /lulc-stats?year=X
```

## 📝 How to Add New Feature

### Example: Add filter by province

1. **Add to constants.js:**

   ```javascript
   export const ADMIN_LEVELS = {
     PROVINCE: "province",
     KABUPATEN: "kabupaten",
     // ...
   };
   ```

2. **Add to filterBuilder.js:**

   ```javascript
   export const buildProvinceFilter = (province) => {
     return `province='${province}'`;
   };
   ```

3. **Add to store (mapStore.js):**

   ```javascript
   breadcrumbs: { province: null, kab: null, ... }
   ```

4. **Create UI component & wire it up**

## 🐛 Debugging Tips

### Check state:

```javascript
// Browser console
useMapStore.getState(); // See all state
```

### Check cache:

```javascript
localStorage.getItem("mapCache_gee");
localStorage.getItem("mapCache_geojson");
```

### Check pending requests:

```javascript
useMapStore.getState().pendingRequests;
```

### Network tab:

- Filter by "geoserver" untuk WFS calls
- Filter by "gee.simontini" untuk GEE calls

## ✅ Code Quality Checklist

- [ ] Use constants dari `config/constants.js` (jangan hardcode)
- [ ] Use filterBuilder untuk WFS filters
- [ ] Cache data when fetching (request deduplication)
- [ ] Update URL when state changes (`updateUrl()`)
- [ ] Clean up event listeners (use cleanup functions)
- [ ] Await promise sebelum next operation (race conditions!)
- [ ] Layer removal order: hover line → layer → source (PENTING!)

## 🤔 Common Questions

**Q: Kenapa ada dua cache? (geeCache + geoJsonCache)**  
A: GEE tiles = raster imagery, GeoJSON = vector boundaries. Different data types, different caches.

**Q: Kenapa `waitForSourceData` lebih baik dari setTimeout?**  
A: Event-driven menunggu SAMPAI data siap, bukan guess-based timing.

**Q: Bagaimana breadcrumbs di-sync dengan URL?**  
A: Every state change calls `updateUrl()` → browser history updated → URL refreshable!

**Q: Apa itu `requestDeduplication`?**  
A: Jika user click 2x cepat, hanya 1 request yang dijalankan. Request lain menunggu hasil yang sama.

---

**Tips:** Jika ada yang confusing, check console logs. Code punya info comments di key places!
