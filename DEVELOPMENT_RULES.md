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
