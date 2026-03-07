# Copilot Instructions — My MapLibre App

Panduan ini wajib dibaca sebelum membuat atau mengubah kode apapun di project ini.
Lihat `DEVELOPMENT_RULES.md` untuk rules lengkap dan contohnya.

---

## 🏗️ Stack & Entry Points

| Layer    | Technology                            |
| -------- | ------------------------------------- |
| Frontend | React 18 + Vite                       |
| State    | Zustand (`src/store/`)                |
| Map      | MapLibre GL 5.x                       |
| Routing  | React Router v6                       |
| Styling  | Tailwind CSS v4                       |
| Charting | ECharts for React                     |
| Hosting  | Vercel (SPA rewrite di `vercel.json`) |

- **Dev server:** `npm run dev` → `http://localhost:5173`
- **Build:** `npm run build`
- **Entry:** `src/main.jsx` → `src/App.jsx`

---

## 📁 Struktur File & Cara Menggunakannya

```
src/
├── config/constants.js       ← SEMUA magic numbers & strings ada di sini
├── data/kabupatens.js        ← Data statis daftar kabupaten
├── store/
│   ├── mapStore.js           ← Global state (cache, breadcrumbs, year, map instance)
│   └── mapLayerStore.js      ← Layer management (load/remove MapLibre layers)
├── utils/
│   ├── filterBuilder.js      ← Builder CQL filter untuk WFS request
│   ├── mapDrilldown.js       ← Logic drill-down kabupaten → kecamatan → desa
│   ├── mapLoadingSetup.js    ← Auto-load layer dari URL params saat app start
│   ├── mapUtils.js           ← Pure helpers: waitForSourceData, zoomToFeature
│   ├── dataTransform.js      ← Normalizer response dari GeoServer/GEE
│   └── urlStateSync.js       ← Sinkronisasi URL query param ↔ Zustand state
└── components/               ← React UI (Map.jsx adalah komponen terbesar)
```

---

## ✅ Non-Negotiable Rules

### 1. Semua Konstanta dari `constants.js`

Tidak ada magic number atau string hardcode di luar `src/config/constants.js`.

```js
// ✅ BENAR
import { LAYER_IDS, API_ENDPOINTS, CACHE_CONFIG } from "../config/constants.js";

// ❌ SALAH
const layerId = "kabupaten-fill"; // hardcoded langsung
```

### 2. Semua Komentar Bahasa Indonesia

Gunakan Bahasa Indonesia 100% untuk komentar. Jelaskan **KENAPA**, bukan **APA**.

```js
// ✅ BENAR — menjelaskan kenapa
// Percaya TTL 1.5 jam karena GEE auth token expire ~2 jam, cache lebih pendek untuk aman

// ❌ SALAH — hanya menjelaskan apa
// Set TTL ke 1.5 jam
```

Format section divider: `// ─── NAMA SECTION ───`

### 3. Nama Variabel Deskriptif, No Abbreviations

```js
// ✅ BENAR
KABUPATENS.find((kabupatenRecord) => kabupatenRecord.name === rawKab);

// ❌ SALAH
KABUPATENS.find((k) => k.name === rawKab);
```

### 4. Gunakan `activeController` yang Ada di `mapLayerStore.js`

Jangan membuat `new AbortController()` baru di dalam fungsi.

```js
// ✅ BENAR — pakai yang sudah ada
const response = await fetch(url, { signal: activeController.signal });

// ❌ SALAH — jangan buat baru
const controller = new AbortController();
```

### 5. Gunakan `filterBuilder.js` untuk Semua CQL Filter

```js
// ✅ BENAR
import { buildKecamatanFilter } from "../utils/filterBuilder.js";
const filter = buildKecamatanFilter({ kab, kec });

// ❌ SALAH
const filter = `kab='${kab}' AND kec='${kec}'`;
```

### 6. Layer Removal Order (PENTING — jangan dibalik!)

```js
// ✅ Urutan benar
// 1. Remove hover/line layer
// 2. Remove main fill layer
// 3. Remove source
// ❌ Menghapus source sebelum layer = error MapLibre
```

---

## 🔄 Data Flow Utama

### GEE Tile Caching

```
loadGEEPolygonRaster()
  → cek in-memory geeCache (Zustand)
  → cek localStorage (CACHE_CONFIG.STORAGE_KEY_GEE)
  → cek pendingRequests (dedup)
  → fetch dari API_ENDPOINTS.TILE_SERVER
  → validasi URL dengan new Image() probe (tile 4/12/7) — CORS-safe
  → jika expired → clearCacheGEE() + re-fetch
  → simpan ke cache + render ke map
```

### Drill-Down Navigation

```
User klik layer di map
  → attachLayerInteraction → click handler
  → updateBreadcrumb() di store
  → handleBreadcrumbDrill() di mapDrilldown.js
  → removeLayerAndSource() (urutan: hover → fill → source)
  → loadLayer() + waitForSourceData()
  → zoomToFeature()
  → loadGEEPolygonRaster()
  → loadLayer() level berikutnya
```

### URL ↔ State Sync

```
Setiap perubahan state → updateUrl() → browser history (no reload)
App start → parseUrlState() → restore ke Zustand → trigger useEffect
```

### Two useEffect Pattern di `Map.jsx`

```js
// Effect 1: Init map SEKALI
useEffect(() => {
  map.on("load", () => setIsMapReady(true));
}, [setMap]);

// Effect 2: Load layers saat breadcrumbs berubah
useEffect(() => {
  if (!isMapReady) return;
  loadLayers();
}, [breadcrumbs, isMapReady]);
```

Jangan gabungkan kedua effect ini — mereka memisahkan init dari data loading untuk cegah race condition.

---

## 🔌 Integrasi Eksternal

| Service         | URL                                      | Tipe Data               |
| --------------- | ---------------------------------------- | ----------------------- |
| GEE Tile Server | `https://gee.simontini.id/gee`           | Raster LULC tiles (XYZ) |
| GeoServer WFS   | `https://aws.simontini.id/geoserver/ows` | GeoJSON boundaries      |

- GEE URL mengandung token sementara (~2 jam) → cache TTL 1.5 jam (`CACHE_CONFIG.GEE_TTL_MS`)
- GeoJSON boundaries jarang berubah → cache TTL 2 hari (`CACHE_CONFIG.GEOJSON_TTL_MS`)
- Validasi GEE URL pakai `new Image()` (bukan `fetch` HEAD — kena CORS)

---

## 🗂️ Zustand Store Keys

### `mapStore.js`

| Key               | Tipe                | Keterangan                         |
| ----------------- | ------------------- | ---------------------------------- |
| `map`             | MapLibre instance   | Map yang sedang aktif              |
| `isMapReady`      | boolean             | True setelah `map.on('load')`      |
| `breadcrumbs`     | `{ kab, kec, des }` | Level navigasi saat ini            |
| `year`            | number              | Tahun LULC yang dipilih            |
| `selectedKab`     | string              | Kabupaten yang aktif               |
| `geeCache`        | object              | Cache URL tile GEE                 |
| `geoJsonCache`    | object              | Cache GeoJSON boundaries           |
| `pendingRequests` | Set                 | Track request yang sedang berjalan |

---

## 🧩 Responsive & UI Patterns

- Breakpoint utama: `lg:` (desktop vs mobile)
- Mobile sidebar: drawer pattern — `isSidebarOpen` state di `App.jsx`, backdrop div untuk close on outside click
- Hamburger button di `Map.jsx` (`lg:hidden`) → toggle sidebar via `onToggleSidebar` prop chain: `App → RightPanel → Map`
- Legend + TimeSelector: grouped di `absolute bottom-5 left-4` wrapper di `Map.jsx`
- Glassmorphism dark style: `bg-black/60 backdrop-blur-md rounded-xl border border-white/10`

---

## ➕ Cara Menambah Fitur Baru

### Tambah Konstanta Baru

Edit `src/config/constants.js` — jangan scatter di file lain.

### Tambah CQL Filter Baru

Tambah fungsi baru di `src/utils/filterBuilder.js`, import di semua tempat yang butuh.

### Tambah Layer Baru

1. Tambah IDs ke `LAYER_IDS` dan `SOURCE_IDS` di `constants.js`
2. Implementasi load/remove di `mapLayerStore.js`
3. Ikuti urutan remove: hover → fill → source

### Tambah State Global Baru

Tambah ke store yang relevan (`mapStore.js`) dengan komentar WHY dalam Bahasa Indonesia.

---

## 🐛 Debugging Cepat

```js
// Lihat semua state Zustand di konsol browser
useMapStore.getState();

// Periksa cache GEE
localStorage.getItem("mapCache_gee");

// Periksa cache GeoJSON
localStorage.getItem("mapCache_geojson");

// Periksa pending requests
useMapStore.getState().pendingRequests;
```

Network tab:

- Filter `geoserver` → WFS calls
- Filter `gee.simontini` → GEE tile calls

---

## ⚠️ Pantangan

- ❌ Jangan `new AbortController()` di dalam fungsi — pakai `activeController` yang ada
- ❌ Jangan hardcode URL, layer name, color, atau TTL — semua dari `constants.js`
- ❌ Jangan buat CQL filter string manual — pakai `filterBuilder.js`
- ❌ Jangan hapus source sebelum layernya — error MapLibre
- ❌ Jangan komentar pakai Bahasa Inggris
- ❌ Jangan gunakan abbreviasi: `res`, `fid`, `kec` (sebagai variabel lokal), `k`
- ❌ Jangan blocking operation di cache-hit path (Rule B)
- ❌ Jangan ubah format localStorage atau URL params tanpa migration function (Rule 4)
- ❌ Jangan `useMapStore()` tanpa selector — pakai `useShallow` atau selector individu (BP-1)
- ❌ Jangan duplikasi logic yang sudah ada di `src/utils/` — import & reuse (BP-2)
- ❌ Jangan import konstanta lewat file perantara — langsung dari `constants.js` (BP-3)
- ❌ Jangan tulis komentar verbose / multi-line docblock untuk hal yang jelas dari kode (BP-5)

---

## ⚡ Best Practices (ringkasan)

Lihat `DEVELOPMENT_RULES.md` bagian **Best Practices** untuk contoh lengkap.

| ID   | Topik                          | Inti                                                            |
| ---- | ------------------------------ | --------------------------------------------------------------- |
| BP-1 | Zustand Selective Subscription | `useShallow` untuk 2+ field, selector individu untuk 1 field    |
| BP-2 | Reuse Utility                  | Jangan duplikasi logic — import dari `src/utils/`               |
| BP-3 | Import Konstanta               | Langsung dari `constants.js`, bukan lewat file perantara        |
| BP-4 | Error Handling                 | `catch { }` tanpa variabel jika error tidak diproses            |
| BP-5 | Komentar Ringkas               | 1 baris header, section divider pendek, WHY bukan WHAT          |
| BP-6 | MapLibre Cleanup               | Cleanup layer & listener di `useEffect` return                  |
| BP-7 | Pisah useEffect                | Init map dan load data di effect terpisah, cegah race condition |
