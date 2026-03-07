# Development Rules — My MapLibre App

Semua contributor (termasuk AI) WAJIB mengikuti rules ini sebelum menulis atau mengubah kode.

---

## Rule 1: Newbie Friendly & Reusable Code ✅

- **Clear variable names** — tidak boleh ada abbreviasi
- **Functions properly exported & composable** — mudah di-import & di-reuse
- **All constants dari `src/config/constants.js`** — tidak ada magic number / magic string di luar file itu
- **Code mudah dipahami junior developer** — jika logic kompleks, wajib ada komentar

---

## Rule 2: Indonesian Comments ✅

- **100% Bahasa Indonesia** untuk semua komentar di source code
- **Section dividers** menggunakan format: `// ─── NAMA SECTION ───`
- **Jelaskan WHY, bukan WHAT** — komentar harus menjawab "kenapa ini dilakukan" bukan "apa yang dilakukan"

```js
// ✅ BENAR — menjelaskan WHY
// Percaya TTL 1.5 jam karena GEE auth token expire ~2 jam, cache lebih pendek untuk aman

// ❌ SALAH — hanya menjelaskan WHAT
// Set TTL ke 1.5 jam
```

---

## Rule 3: Meaningful Variable Names ✅

- **Descriptive naming everywhere** — nama variabel harus menggambarkan isinya
- **No abbreviations** — `res` → `response`, `fid` → `featureId`, `k` → `kabupatenRecord`
- **Type hints dalam nama** — `isLoading`, `geeCache`, `kecamatanFilter`, `cachedTileUrl`

```js
// ✅ BENAR
KABUPATENS.find((kabupatenRecord) => kabupatenRecord.name === rawKab);

// ❌ SALAH
KABUPATENS.find((k) => k.name === rawKab);
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

### BP-5: Komentar — Ringkas & WHY-Focused

- **Section dividers:** pendek, konsisten — `// ─── NAMA ───` (maks 40 karakter total)
- **Komponen header:** 1 baris, langsung di atas `export function`
- **Inline comment:** hanya jika logic non-obvious (WHY), jangan deskripsikan APA yang jelas dari kode
- **Jangan:** multi-line docblock untuk helper sederhana, divider lebar `═══════...`

```js
// ✅ BENAR — 1 baris, deskriptif, ringkas
// Tab Kependudukan & Keragaman
export function PopulationTab() {

// ✅ BENAR — WHY, bukan WHAT
// D3 me-mutasi objek input, sehingga deep-clone dilakukan setiap kalkulasi

// ❌ SALAH — verbose multi-line untuk hal yang jelas
// ─────────────────────────────────────────────────────────────────────
// Tab Kependudukan & Keragaman
// Menampilkan piramida penduduk, suku, agama, dan tren pendapatan
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
