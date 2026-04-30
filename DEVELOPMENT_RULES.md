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
