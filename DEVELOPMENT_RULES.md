# Development Rules — My MapLibre App

Semua contributor (termasuk AI) WAJIB mengikuti rules ini sebelum menulis atau mengubah kode.

---

## Rule 1: Newbie Friendly & Reusable Code ✅

- **Clear variable names** — tidak boleh ada abbreviasi
- **Functions properly exported & composable** — mudah di-import & di-reuse
- **All constants dari `src/config/constants.js`** — tidak ada magic number / magic string di luar file itu
- **Code mudah dipahami junior developer** — jika logic kompleks, wajib ada komentar

---

## Rule 2: English Comments & Everything Else ✅

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

---

## Rule 3: Meaningful Variable Names — English Only ✅

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

---

## Rule 4: Data Integrity & Backward Compatibility ⭐

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

---

## Rule 5: Correctness, Minimality & Edge Cases ⭐

- ✅ **Strictly preserve correctness** — logic harus tetap benar setelah perubahan
- ✅ **Minimality of change** — jangan scope creep, ubah hanya yang diminta
- ✅ **Handle edge cases robustly** — selalu handle `null`, `undefined`, empty array, `NaN`, dan errors
- ✅ **Respect complex/nested structures** — jangan flatten atau simplify struktur data tanpa diskusi

---

## Rule 6: Performance & Optimization ⭐

- ✅ **React**: gunakan `useMemo`, `useCallback`, dan selective Zustand subscriptions
- ✅ **MapLibre**: manage layers & event listeners dengan benar — selalu cleanup saat unmount
- ✅ **Data**: lazy load, paginate jika perlu, dan cache dengan strategi yang tepat
- ✅ **Memory**: cleanup resources, prevent memory leaks (event listeners, timers, refs)
- ✅ **Bundle**: tree-shake imports, jangan import seluruh library jika hanya butuh satu fungsi

---

## Rule 7: Error Boundaries — Isolasi Component Crash 🛡️

**Aplikasi ini memiliki banyak komponen independen** (map, charts, lists, profile tabs). Tanpa error boundaries, satu component crash akan menghancurkan seluruh halaman.

### Mengapa penting?

```jsx
// ❌ SALAH — tanpa boundary, satu component error = seluruh app crash
<ProfilePage>
  <Tabs>
    {activeTab === 'news' && <NewsTab />}         ← typo → crash seluruh ProfilePage
    {activeTab === 'profile' && <KabupatenProfileTab />} ← null ref → crash
    {activeTab === 'map' && <MapTab />}           ← MapLibre init gagal → crash
  </Tabs>
</ProfilePage>
```

```jsx
// ✅ BENAR — boundary isolasi setiap bagian kritis
<div className="h-screen flex">
  <ErrorBoundary label="Sidebar">
    <LeftPanel />          ← crash di sini tidak affect map
  </ErrorBoundary>
  <ErrorBoundary label="Peta dan Analitik">
    <RightPanel />
  </ErrorBoundary>
</div>

<div className="min-h-screen bg-white">
  <ErrorBoundary label="Konten tab">
    <ActiveTabComponent />
  </ErrorBoundary>
</div>
```

### Aturan implementasi

| Kapan pakai | Contoh |
|------------|--------|
| **Setiap route level** | `<ErrorBoundary label="Aplikasi">` di `App.jsx` |
| **Container besar berisi beberapa komponen independen** | Map view: sidebar + right panel dibungkus separate boundaries |
| **Bagian halaman yang bisa diakses terpisah** | Tab content di `/profile/:kabupatenName` |
| **Bagian dengan external service dependency** | MapLibre map initialization, ECharts rendering |

### Yang TIDAK ditangkap ErrorBoundary

ErrorBoundary hanya menangkap errors dari **render phase**. Ini bukan replacement untuk:

- Async error handling → gunakan try/catch + loading/error state per-component
- Event handler errors → handle di dalam callback
- Promise rejection → `.catch()` atau try/catch di async function

Jadi ErrorBoundary adalah **safety net terakhir**, bukan primary strategy.

### Pattern umum yang salah

❌ Meletakkan satu ErrorBoundary di paling atas (`App.jsx`) saja.
Ini melindungi seluruh app tapi memberikan error message yang terlalu umum. User kehilangan konteks di mana error terjadi.

✅ Memisahkan boundaries per area fungsional yang mandiri. Ini memberi error message spesifik dan user bisa tetap mengakses area lain.

---

## Rule 8: No Logic Duplication — Ekstrak Menjadi Shared Helper 🔁

**Jika ada blok kode yang sama muncul di 2+ tempat, itu harus diekstrak menjadi shared function.** Tidak ada "mungkin suatu hari beda" — copy-paste logic adalah bug yang menunggu terjadi.

### Apa yang termasuk duplicated logic?

| Pola duplikasi | Contoh di codebase kita |
|---------------|------------------------|
| **Cache-first fetch pattern** | `loadLayer()` dan `loadLayerWithCallback()` keduanya punya WFS fetch + cache check + pending dedup |
| **Layer creation logic** | Fill layer + hover line paint specs identik di 2 tempat |
| **Mouse interaction handlers** | Mouse enter/leave/move logic sama persis |
| **Feature ID assignment** | `features.forEach((f) => { if (!f.id) f.id = i })` di 2 tempat |
| **URL building with params** | Multiple places build URLSearchParams identically |
| **Chart data transformation** | Normalize response format → chart-ready array |

### Cara mengekstrak — step by step

**Step 1:** Identifikasi blok yang duplikat (bukan cuma nama variabel, tapi struktur logic)

**Step 2:** Extract jadi function named clearly about WHAT it does

**Step 3:** Replace both callers to use the extracted function

**Step 4:** Verify behavior is identical — no regression

### Contoh nyata dari refactoring `mapLayerStore.js`

**BEFORE (819 baris, 2 fungsi saling duplikat):**
```js
export const loadLayer = async (...) => {
  // ~80 baris: fetchGeoJSON, ensureFeatureIds, renderFillAndHoverLayers, attachInteractions
};

export const loadLayerWithCallback = async (...) => {
  // ~250 baris: fetchGeoJSON (duplikat), ensureFeatureIds (duplikat), 
  //              renderFillAndHoverLayers (duplikat), attachInteractions (duplikat)
};
```

**AFTER (667 baris, shared helpers):**
```js
async function fetchGeoJSONFromWFS(layerName, sourceId, cqlFilter) {
  // Satu implementation: cache-first + WFS fetch + pending dedup
}

function renderAndSetupLayers(map, geoJsonData, sourceId, layerId) {
  // Satu implementation: source update/create + fill + hover line
}

function attachInteractions(map, layerId, onClickHandler) {
  // Satu implementation: mouse events + click delegation
}

export const loadLayer = async (...) => {
  // ~15 baris: orchestrate helpers + drill-down click handler
};

export const loadLayerWithCallback = async (...) => {
  // ~10 baris: orchestrate helpers + local-state click handler
};
```

Hasil: **-152 baris (-19%)**, zero behavioral change.

### Checklist sebelum commit perubahan

- [ ] Ada 2+ tempat menulis pattern/structure logic yang sama?
- [ ] Bisa ditulis sekali sebagai shared helper/function?
- [ ] Semua caller sekarang pakai helper tersebut?
- [ ] Test bahwa behavior tetap sama setelah refactoring?

### Pengecualian

Tidak perlu ekstrak jika:
- **Hanya 1 tempat** — belum duplikat, tunggu tempat kedua muncul
- **Logic berbeda secara fundamental** — meskipun mirip, kalau ada perbedaan branch/edge case, ekstraksi malah membuat code harder to understand
- **Performance critical path** — kadang inline version lebih perform (tapi ini rare)

---

## Tambahan (dari development history)

### Rule A: Gunakan `activeController` yang ada

Tidak boleh membuat `new AbortController()` baru di dalam fungsi.
Selalu gunakan module-level `activeController` yang sudah ada di `mapLayerStore.js`.

```js
// ✅ BENAR
const response = await fetch(url, { signal: activeController.signal });

// ❌ SALAH
const controller = new AbortController();
const response = await fetch(url, { signal: controller.signal });
```

### Rule B: No blocking operation di cache hit path

Jika data ditemukan di cache, tidak boleh ada operasi blocking sebelum render ke map.
Validasi boleh dilakukan (misal: image probe untuk GEE URL), tapi harus non-blocking terhadap user experience.

---

## Best Practices ⚡

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
}, [breadcrumbs, isMapReady]);
```
