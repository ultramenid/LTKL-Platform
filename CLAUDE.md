# Instruksi untuk AI Assistant (Claude / pi / Cursor / Copilot)

**BACA DOKUMEN INI SEPENUHNYA SEBELUM MENYENTUH SATU BARIS KODE PUN.**

Jika tidak membaca dan memahami semua rules di bawah ini terlebih dahulu,
kode yang dihasilkan kemungkinan besar melanggar aturan dan harus ditulis ulang.

---

## Ringkasan Rules yang Paling Sering Dilanggar

### ❌ JANGAN buat `new AbortController()` di fungsi / komponen

```js
// ❌ SALAH
const ctrl = new AbortController();
const response = await fetch(url, { signal: ctrl.signal });

// ✅ BENAR — pakai modul-level activeController
import { abortActiveRequests } from "./store/mapLayerStore.js";
abortActiveRequests(); // batalkan request sebelumnya
const response = await fetch(url, { signal: activeController.signal });
```

### ❌ JANGAN pakai abbreviasi di nama variabel

```js
// ❌ SALAH
const ctrl = ...; const res = ...; const fid = ...; const feat = ...; const k = ...;

// ✅ BENAR
const abortController = ...; const response = ...;
const hoveredFeatureId = ...; const clickedFeature = ...;
const districtRecord = ...; const year = ...;
```

### ❌ JANGAN tulis komentar dalam Bahasa Indonesia

```js
// ❌ WRONG — Indonesian comment
// Tampilkan spinner agar user tahu fetch sedang berjalan

// ✅ CORRECT — English, WHY not WHAT
// Show spinner so user knows fetch is in progress
```

### ❌ JANGAN hardcode constant di luar `constants.js`

```js
// ❌ SALAH
const url = "http://localhost:8000/gee";

// ✅ BENAR
import { API_ENDPOINTS } from "./config/constants.js";
const url = API_ENDPOINTS.TILE_SERVER;
```

### ❌ JANGAN duplikasi logic yang sudah ada di utils/

```js
// ❌ SALAH — tulis ulang filter builder
const filter = `kab='${kab}' AND kec='${kec}'`;

// ✅ BENAR — pakai yang sudah ada
import { buildKecamatanFilter } from "./utils/filterBuilder.js";
const filter = buildKecamatanFilter({ kab, kec });
```

### ❌ JANGAN subscribe ke seluruh Zustand store

```js
// ❌ SALAH
const { year, breadcrumbs, setYear } = useMapStore();

// ✅ BENAR — useShallow untuk 2+ field
import { useShallow } from "zustand/react/shallow";
const { year, setYear } = useMapStore(
  useShallow((state) => ({ year: state.year, setYear: state.setYear })),
);
```

### ❌ JANGAN taruh satu ErrorBoundary terlalu tinggi

```jsx
// ❌ SALAH — boundary terlalu luas, error message tidak spesifik
<App>
  <ErrorBoundary label="Aplikasi">
    <Routes>...</Routes>
  </ErrorBoundary>
</App>

// ✅ BENAR — boundary per area fungsional yang mandiri
<div className="h-screen flex">
  <ErrorBoundary label="Sidebar">
    <LeftPanel />          ← crash di sini tidak affect map
  </ErrorBoundary>
  <ErrorBoundary label="Peta dan Analitik">
    <RightPanel />
  </ErrorBoundary>
</div>
```

### ❌ JANGAN biarkan logic duplikat hidup

Kalau ada blok kode sama muncul 2+ tempat → extract jadi shared helper.
Contoh nyata: `loadLayer()` dan `loadLayerWithCallback()` dulunya punya WFS fetch,
layer rendering, dan mouse events yang identik (~500 baris duplikat).
Sudah direfactor jadi 3 shared helpers dengan hasil **-152 baris, -19%**.

```js
// ❌ SALAH — 2 fungsi berbeda tapi isi logika sama persis
export const loadLayer = async (map, layerName, sourceId, layerId, cqlFilter) => {
  const wfsParams = new URLSearchParams({...}); // duplikat!
  const cached = store.getCacheGeoJSON(cacheKey); // duplikat!
  // ... render fill + hover layers (duplikat!) ...
  // ... attach hover/click handlers (duplikat!) ...
};

export const loadLayerWithCallback = async (map, ...) => {
  const wfsParams = new URLSearchParams({...}); // duplikat!
  const cached = store.getCacheGeoJSON(cacheKey); // duplikat!
  // ... render fill + hover layers (duplikat!) ...
  // ... attach hover/click handlers (duplikat!) ...
};

// ✅ BENAR — shared helpers, orchestration di public function
async function fetchGeoJSONFromWFS(layerName, sourceId, cqlFilter) {
  // Satu implementation: cache-first + WFS fetch + pending dedup
}

function renderAndSetupLayers(map, geoJsonData, sourceId, layerId) {
  // Satu implementation: source update/create + fill layer + hover line layer
}

function attachInteractions(map, layerId, onClickHandler) {
  // Satu implementation: mouse enter/leave/move + click delegation
}
```

---

## Panduan Lengkap Development Rules

Semua rules detail dari DEVELOPMENT_RULES.md dirangkum di bawah ini.

### Rule 1: Newbie Friendly & Reusable Code

- **Clear variable names** — tidak boleh ada abbreviasi
- **Functions properly exported & composable** — mudah di-import & di-reuse
- **All constants dari `src/config/constants.js`** — tidak ada magic number / magic string di luar file itu
- **Code mudah dipahami junior developer** — jika logic kompleks, wajib ada komentar

### Rule 2: English Comments & Everything Else

- **Comments: 100% English** — all comments (inline, block, section headers)
- **Variables, functions, classes: 100% English** — all variable, function, and class names in English
- **UI strings: local language only** — only labels & text visible to user may use Indonesian
- **Section dividers** format: `// ─── SECTION NAME ───`
- **Explain WHY, not WHAT** — comments should explain "why this is done" not "what is being done"

```js
// ✅ CORRECT — explains WHY
// Trust TTL 1.5h because GEE auth token expires ~2h, shorter cache for safety margin

// ❌ WRONG — only explains WHAT
// Set TTL to 1.5 hours
```

### Rule 3: Meaningful Variable Names — English Only

- **Variables & functions harus descriptive** — nama harus menggambarkan isinya dalam Bahasa Inggris
- **No abbreviations** — `res` → `response`, `fid` → `featureId`, `k` → `districtRecord`, `tahun` → `year`
- **Type hints dalam nama** — `isLoading`, `geeCache`, `districtFilter`, `cachedTileUrl`
- **Constructor parameter: Bahasa Inggris** — jika ada parameter Bahasa Indonesia di API eksternal, rename saat import

```js
// ✅ BENAR
DISTRICTS.find((districtRecord) => districtRecord.name === rawName);
const chartHeight = 620; // Tinggi chart untuk layout

// ❌ SALAH
KABUPATENS.find((k) => k.name === rawKab); // Variabel singkat
const TINGGI_CHART = 620; // Nama Bahasa Indonesia
```

### Rule 4: Data Integrity & Backward Compatibility ⭐

**KRITIS** — Refactoring TIDAK BOLEH:

- 🚫 Silently discard / mengubah user data
- 🚫 Break existing localStorage format
- 🚫 Mengubah URL query param format tanpa migration
- 🚫 Menghapus hooks / entry points tanpa warning

**HARUS:**

- ✅ Buat migration function (invertible) jika format berubah
- ✅ Preserve optional hooks agar callers tidak break
- ✅ Update localStorage dengan versioning jika schema berubah
- ✅ Log warning jika data di-migrate secara otomatis
- ✅ Provide rollback option untuk perubahan breaking

### Rule 5: Correctness, Minimality & Edge Cases ⭐

- ✅ **Strictly preserve correctness** — logic harus tetap benar setelah perubahan
- ✅ **Minimality of change** — jangan scope creep, ubah hanya yang diminta
- ✅ **Handle edge cases robustly** — selalu handle `null`, `undefined`, empty array, `NaN`, dan errors
- ✅ **Respect complex/nested structures** — jangan flatten atau simplify struktur data tanpa diskusi

### Rule 6: Performance & Optimization ⭐

- ✅ **React**: gunakan `useMemo`, `useCallback`, dan selective Zustand subscriptions
- ✅ **MapLibre**: manage layers & event listeners dengan benar — selalu cleanup saat unmount
- ✅ **Data**: lazy load, paginate jika perlu, dan cache dengan strategi yang tepat
- ✅ **Memory**: cleanup resources, prevent memory leaks (event listeners, timers, refs)
- ✅ **Bundle**: tree-shake imports, jangan import seluruh library jika hanya butuh satu fungsi

### Rule 7: Error Boundaries — Isolasi Component Crash 🛡️

**Aplikasi ini memiliki banyak komponen independen** (map, charts, lists, profile tabs). Tanpa error boundaries, satu component crash akan menghancurkan seluruh halaman.

#### Mengapa penting?

Tanpa boundary, satu render error di `KabupatenProfileTab` akan menghancurkan **seluruh profile page** termasuk hero section dan tab navigation. Dengan boundary, user bisa klik tab lain dan aplikasi tetap usable.

Component yang butuh ErrorBoundary wrapper:
- `LeftPanel.jsx` (sidebar — list kabupaten, bisa crash jika data corrupt)
- `RightPanel.jsx` (map view — MapLibre init, layer loading, event binding — high risk)
- Tab content di `/profile/:kabupatenName` (berbagai tab bisa crash sendiri-sendiri)
- Komponen dengan external service dependency (MapLibre map initialization, ECharts rendering)

#### Yang TIDAK ditangkap ErrorBoundary

ErrorBoundary **hanya** menangkap errors dari **render phase**. Ini bukan replacement untuk:

- Async errors (promises reject) → ini sudah dihandle per-component dengan try/catch + state loading/error
- Event handlers → sudah pakai `.catch()` di setiap useEffect fetch
- setTimeout/setInterval → tidak ada di codebase ini

Jadi ErrorBoundary adalah **safety net terakhir**, bukan primary strategy.

#### Pattern umum yang salah

❌ Meletakkan satu ErrorBoundary di paling atas (`App.jsx`) saja.
Ini melindungi seluruh app tapi memberikan error message yang terlalu umum. User kehilangan konteks di mana error terjadi.

✅ Memisahkan boundaries per area fungsional yang mandiri. Ini memberi error message spesifik dan user bisa tetap mengakses area lain.

### Rule 8: No Logic Duplication — Ekstrak Menjadi Shared Helper 🔁

**Jika ada blok kode yang sama muncul di 2+ tempat, itu harus diekstrak menjadi shared function.** Tidak ada "mungkin suatu hari beda" — copy-paste logic adalah bug yang menunggu terjadi.

#### Apa yang termasuk duplicated logic?

| Pola duplikasi | Contoh di codebase kita |
|---------------|------------------------|
| Cache-first fetch pattern | `loadLayer()` dan `loadLayerWithCallback()` keduanya punya WFS fetch + cache check + pending dedup |
| Layer creation logic | Fill layer + hover line paint specs identik di 2 tempat |
| Mouse interaction handlers | Mouse enter/leave/move logic sama persis |
| Feature ID assignment | `features.forEach((f) => { if (!f.id) f.id = i })` di 2 tempat |
| URL building with params | Multiple places build URLSearchParams identically |
| Chart data transformation | Normalize response format → chart-ready array |

#### Cara mengekstrak — step by step

1. **Identifikasi blok yang duplikat** (bukan cuma nama variabel, tapi structure logic)
2. **Extract jadi function** named clearly about WHAT it does
3. **Replace both callers** to use the extracted function
4. **Verify behavior is identical** — no regression

#### Checklist sebelum commit perubahan

- [ ] Ada 2+ tempat menulis pattern/structure logic yang sama?
- [ ] Bisa ditulis sekali sebagai shared helper/function?
- [ ] Semua caller sekarang pakai helper tersebut?
- [ ] Test bahwa behavior tetap sama setelah refactoring?

#### Pengecualian (tidak perlu ekstrak)

- **Hanya 1 tempat** — belum duplikat, tunggu tempat kedua muncul
- **Logic berbeda secara fundamental** — meskipun mirip, kalau ada perbedaan branch/edge case, ekstraksi malah membuat code harder to understand
- **Performance critical path** — kadang inline version lebih perform (tapi ini rare)

### Tambahan (dari development history)

#### Rule A: Gunakan `activeController` yang ada

Tidak boleh membuat `new AbortController()` baru di dalam fungsi.
Selalu gunakan module-level `activeController` yang sudah ada di `mapLayerStore.js`.

```js
// ✅ BENAR
const response = await fetch(url, { signal: activeController.signal });

// ❌ SALAH
const controller = new AbortController();
const response = await fetch(url, { signal: controller.signal });
```

#### Rule B: No blocking operation di cache hit path

Jika data ditemukan di cache, tidak boleh ada operasi blocking sebelum render ke map.
Validasi boleh dilakukan (misal: image probe untuk GEE URL), tapi harus non-blocking terhadap user experience.

---

## Best Practices

### BP-1: Zustand — Selective Subscriptions dengan `useShallow`

Zustand v5 merekomendasikan **jangan** destructure langsung dari `useStore()` tanpa selector.
Setiap komponen harus subscribe hanya ke state yang benar-benar dipakai.

```js
// ✅ BENAR — hanya re-render saat breadcrumbs / resetBreadcrumbs / setMap berubah
import { useShallow } from "zustand/react/shallow";

const { breadcrumbs, resetBreadcrumbs, setMap } = useMapStore(
  useShallow((state) => ({
    breadcrumbs: state.breadcrumbs,
    resetBreadcrumbs: state.resetBreadcrumbs,
    setMap: state.setMap,
  })),
);

// ✅ BENAR — selector individual untuk 1 field saja (tidak perlu useShallow)
const breadcrumbs = useMapStore((state) => state.breadcrumbs);

// ❌ SALAH — subscribe ke SELURUH store, re-render walau field lain berubah
const { breadcrumbs, resetBreadcrumbs, setMap } = useMapStore();
```

**Kapan pakai apa:**

- **1 field** → selector individual: `useMapStore((state) => state.year)`
- **2+ fields** → `useShallow` + object pick
- **Diluar React** (event handler, utility) → `useMapStore.getState()` (tanpa hook)

### BP-2: Reuse Utility Functions — Jangan Duplikasi Logic

Jika logic sudah ada di `src/utils/`, jangan tulis ulang di komponen.
Contoh: normalisasi response server sudah ada di `dataTransform.js`.

```js
// ✅ BENAR — pakai yang sudah ada
import {
  normalizeServerResponse,
  transformDataForChart,
} from "../utils/dataTransform.js";
const normalizedData = normalizeServerResponse(serverResponse, year);

// ❌ SALAH — duplikasi logic di komponen
const normalizedData = useMemo(() => {
  if (serverResponse.year && Array.isArray(serverResponse.data)) {
    return { year: Number(serverResponse.year), data: serverResponse.data };
  }
  // ... 30+ baris logic yang sama persis ...
}, [serverResponse]);
```

### BP-3: Import Konstanta — Selalu Langsung dari `constants.js`

Jangan re-import konstanta lewat file perantara. Ini mencegah circular dependency dan mempermudah tree-shaking.

```js
// ✅ BENAR — import langsung dari sumbernya
import { API_ENDPOINTS, COLORS } from "../config/constants.js";
const statsUrl = `${API_ENDPOINTS.TILE_SERVER}/lulc-stats`;

// ❌ SALAH — import lewat file perantara
import { TILE_SERVER_URL } from "../store/mapLayerStore.js";
```

### BP-4: Error Handling — Catch Tanpa Variabel Jika Tidak Dipakai

Jika `catch` block hanya untuk menelan error (no-op), jangan beri nama variabel error.

```js
// ✅ BENAR — catch tanpa variabel
try {
  localStorage.removeItem(key);
} catch {
  /* abaikan */
}

// ❌ SALAH — variabel e tidak dipakai
try {
  localStorage.removeItem(key);
} catch (e) {
  /* abaikan */
}
```

### BP-5: Comments — Concise & WHY-Focused

- **Section dividers:** short, consistent — `// ─── NAME ───` (max 40 chars total)
- **Component header:** 1 line, right above `export function`
- **Inline comment:** only for non-obvious logic (WHY), don't describe WHAT is clear from code
- **Avoid:** multi-line docblocks for simple helpers, wide dividers `═══════...`

```js
// ✅ CORRECT — 1 line, descriptive, concise
// Population & Diversity tab
export function PopulationTab() {

// ✅ CORRECT — WHY, not WHAT
// D3 mutates the input object, so deep-clone is performed each calculation

// ❌ WRONG — verbose multi-line for obvious things
// ─────────────────────────────────────────────────────────────────────
// Population & Diversity tab
// Shows population pyramid, ethnicity, religion, and income trends
// ─────────────────────────────────────────────────────────────────────
```

### BP-6: MapLibre — Cleanup Layer di `useEffect` Return

Saat komponen unmount atau dependency berubah, pastikan layer & event listener di-cleanup.

```js
useEffect(() => {
  // Setup map...
  return () => {
    try {
      if (mapRef.current) mapRef.current.remove();
    } catch {
      /* abaikan */
    }
    mapRef.current = null;
  };
}, []);
```

### BP-7: Pisahkan `useEffect` Berdasarkan Tanggung Jawab

Jangan gabungkan init map dan load data dalam satu `useEffect`.
Pisahkan agar dependency array jelas dan tidak ada race condition.

```js
// Effect 1: Init map SEKALI
useEffect(() => {
  const map = new maplibregl.Map({ ... });
  map.on("load", () => setIsMapReady(true));
  return () => map.remove();
}, []);

// Effect 2: Load layers saat state berubah
useEffect(() => {
  if (!isMapReady) return;
  loadLayersForBreadcrumb();
}, [breadcrumbs, isMapReady]); // Triggers on state change
```

---

## Arsitektur & Patterns Penting

### Struktur Folder

```
src/
├── components/          → React components untuk UI
├── store/               → State management (Zustand)
├── utils/               → Helper functions & business logic
├── config/              → Configuration & constants
├── data/                → Static data (kabupatens.js)
└── assets/              → Images, icons, etc
```

### Data Flow Utama

```
URL params → parseUrlState() → useMapStore.setState() → useEffect trigger → loadLayers()
User click kabupaten → attachLayerInteraction → updateBreadcrumb() → handleBreadcrumbDrill() → load next level
User change year → setYear() → updateUrl() → loadGEEPolygonRaster() dengan filter baru
```

### Cache Strategy (THREE-TIER)

```
Check in-memory cache (Zustand) → Check localStorage → Check pending requests (dedup) → Fetch from API
```

### Event-Driven Waits (BUKAN setTimeout)

```js
// ❌ OLD: hardcoded delay
await new Promise((resolve) => setTimeout(resolve, 200));

// ✅ NEW: event-driven wait
await waitForSourceData(map, sourceId);
```

Lebih cepat di koneksi bagus, lebih reliable di koneksi lambat.

### Layer Removal Order (CRITICAL!)

```
✅ Benar: 1. Remove hover line layer → 2. Remove main fill layer → 3. Remove source
❌ Salah: Source removed dulu → MapLibre error!
```

### External Services (TIDAK PERLU DIUBAH)

- **GeoServer WFS**: `https://aws.simontini.id/geoserver/ows` — Admin boundary GeoJSON (kab/kec/desa)
- **GEE Tile Server**: `$VITE_TILE_SERVER` env var — LULC raster tiles + `/lulc-stats` endpoint

Keduanya sudah running. Backend baru hanya melayani **data profil kabupaten** (masih hardcoded di komponen).

---

## Self-Audit Checklist — WAJIB Dicentang Sebelum Setiap Edit/Write

- [ ] Semua variable: descriptive English, zero abbreviations (k → districtRecord, res → response)
- [ ] All comments: English, answering WHY not WHAT
- [ ] All constants: from `constants.js` (not hardcoded)
- [ ] Tidak ada `new AbortController()` di luar `mapLayerStore.js`
- [ ] Logic yang sudah ada: cek `utils/` dan `store/` sebelum menulis ulang
- [ ] Ada logic duplikat di file ini? Kalau ada → extract ke shared helper (Rule 8)
- [ ] Area ini punya ErrorBoundary? Jika komponen besar/independen → bungkus dengan boundary (Rule 7)
- [ ] `useShallow` untuk 2+ fields dari Zustand (BP-1)
- [ ] Event listener di-cleanup di `useEffect` return (BP-6)
- [ ] `catch {}` tidak pakai variabel jika error tidak dipakai (BP-4)
- [ ] Layer removal order: hover-line → fill-layer → source (Architecture Guide)
- [ ] Menggunakan `waitForSourceData()` bukan `setTimeout()` (Architecture Guide)
- [ ] Menggunakan `activeController` dari `mapLayerStore.js` (Rule A)
- [ ] Tidak ada blocking operation di cache-hit path (Rule B)

---

## File Rules Lengkap

- **DEVELOPMENT_RULES.md** — Semua rules detail dengan contoh (sumber truth utama)
- **ARCHITECTURE_GUIDE.md** — Struktur folder, data flow, pattern yang dipakai
- **PACKAGES_REFERENCE.md** — Library apa saja yang tersedia

Jika ada konflik antara file-file ini dan dokumen ini,
**DEVELOPMENT_RULES.md yang berlaku.**

## Catatan Penting

1. **Supply chain data** saat ini diproses dari `palmoil.csv` melalui script `build-supplychain-data.mjs`. Saat migrasi ke database backend, script ini bisa dijadikan importer satu kali.
2. **LULC stats** (`/lulc-stats`) sudah dilayani GEE Tile Server — **tidak perlu dipindahkan**.
3. **GeoServer boundaries** sudah stabil — **tidak perlu disentuh**.
4. **Kabupaten slug** harus konsisten: lowercase, spasi diganti dash. `"Bone Bolango"` → `"bone-bolango"`
5. Semua tab yang menampilkan data hardcoded Sigi perlu dirancang agar `kabupatenName` prop diteruskan ke API call — bukan membaca data statis.
6. **Backend planning** sudah dibuat di `BACKEND_PLANNING.md` — menggantikan ~500 baris hardcoded data di frontend.

## Production ready
