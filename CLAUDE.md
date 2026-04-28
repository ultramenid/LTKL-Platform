# Instruksi untuk AI Assistant (Claude / pi / Cursor / Copilot)

**BACA INI SEBELUM MENYENTUH SATU BARIS KODE PUN.**

---

## Langkah wajib di awal SETIAP sesi

```
1. baca DEVELOPMENT_RULES.md  (rules coding wajib)
2. baca ARCHITECTURE_GUIDE.md (struktur & pattern codebase)
3. baru mulai coding
```

Jika tidak membaca keduanya terlebih dahulu, kode yang dihasilkan kemungkinan besar
melanggar rules dan harus ditulis ulang.

---

## Ringkasan rules yang paling sering dilanggar

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
const ctrl = ...; const res = ...; const fid = ...; const feat = ...;

// ✅ BENAR
const abortController = ...; const response = ...;
const hoveredFeatureId = ...; const clickedFeature = ...;
```

### ❌ JANGAN tulis komentar dalam Bahasa Inggris

```js
// ❌ SALAH — English comment
// Set loading state to true

// ✅ BENAR — Indonesian, WHY bukan WHAT
// Tampilkan spinner agar user tahu fetch sedang berjalan
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

---

## Self-audit checklist sebelum setiap `edit` / `write`

- [ ] Semua variable: descriptive English, zero abbreviations
- [ ] Semua komentar: Bahasa Indonesia, menjawab WHY bukan WHAT
- [ ] Semua constants: dari `constants.js`
- [ ] Tidak ada `new AbortController()` di luar `mapLayerStore.js`
- [ ] Logic yang sudah ada: cek `utils/` dan `store/` sebelum menulis ulang
- [ ] `useShallow` untuk 2+ fields dari Zustand
- [ ] Event listener di-cleanup di `useEffect` return
- [ ] `catch` tanpa variabel jika error tidak dipakai: `catch { }` bukan `catch (e) { }`

---

## File rules lengkap

- **DEVELOPMENT_RULES.md** — semua rules detail dengan contoh
- **ARCHITECTURE_GUIDE.md** — struktur folder, data flow, pattern yang dipakai
- **PACKAGES_REFERENCE.md** — library apa saja yang tersedia

Jika ada konflik antara file ini dan `DEVELOPMENT_RULES.md`,
**DEVELOPMENT_RULES.md yang berlaku**.

## Production ready
