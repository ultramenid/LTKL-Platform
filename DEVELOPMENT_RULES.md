# Development Rules - My MapLibre App

**Version:** 1.1 (Rule #4 Added Feb 2026)

Pedoman pengembangan untuk menjaga code quality, maintainability, dan user data integrity.

---

## **Rule 1: Newbie Friendly & Reusable Code** ✅

**Deskripsi:**

- Clear variable names (no `a`, `b`, `x`, `data`)
- Functions properly exported dan composable
- No hardcoding - semua constants dari `src/config/constants.js`
- Code harus mudah dipahami newbie/junior developer

**Contoh:**

```javascript
// ✅ GOOD
const kabupatenName = "Bantul";
const initialCenterCoordinate = [120.216667, -1.5];
export const loadDesaLevel = (filters) => {
  /* ... */
};

// ❌ BAD
const n = "Bantul";
const c = [120.216667, -1.5];
const load = () => {
  /* ... */
}; // load apa?
```

**Status:** ✅ Applied di 13 files (Session 7)

---

## **Rule 2: Indonesian Comments** ✅

**Deskripsi:**

- 100% Bahasa Indonesia untuk maintainability
- Simple, natural style (bukan AI-generated JSDoc)
- Section dividers dengan `─── SECTION ───`
- Jelaskan WHY, bukan WHAT (WHAT sudah jelas dari code)

**Contoh:**

```javascript
// ✅ GOOD
// ─── CEK CACHE ───
// Ambil data dari cache Zustand (paling cepat)
// Jika ada, return langsung tanpa fetch ke API
const cachedGEE = useMapStore.getCacheGEE(cacheKey);

// ❌ BAD
// Get the cached data
const cache = getCache(key);
```

**Status:** ✅ Applied di 13 files (Session 7)

---

## **Rule 3: Meaningful Variable Names** ✅

**Deskripsi:**

- Descriptive naming everywhere
- Function names clearly state purpose
- No abbreviations (`res` → `response`, `fid` → `featureId`)
- Include type hints (`isLoading`, `geeCache`, `kecamatanFilter`)

**Contoh Renames (Session 7):**

| Sebelum       | Sesudah              | Alasan                                    |
| ------------- | -------------------- | ----------------------------------------- |
| `fid`         | `featureId`          | Jelas ini feature ID                      |
| `query`       | `queryParams`        | Ini query parameters, bukan string biasa  |
| `res`         | `serverResponse`     | Response dari server, bukan generic `res` |
| `kabName`     | `kabupatenName`      | Bahasa Indonesia, lebih deskriptif        |
| `now`         | `currentTime`        | Lebih explicit                            |
| `mounted`     | `isComponentMounted` | Boolean dengan prefix `is`                |
| `cache`       | `allCacheEntries`    | Plural karena array/object                |
| `lastHoverId` | `lastHoverFeatureId` | Spesifik apa yang di-hover                |

**Status:** ✅ 50+ renames applied (Session 7)

---

## **Rule 4: Data Integrity & Backward Compatibility** ⭐ NEW

**Deskripsi (Penting!):**

Refactorings dan bugfixes **TIDAK BOLEH**:

- 🚫 Silently discard/mask/change user data
- 🚫 Break existing localStorage/cache format
- 🚫 Change URL query parameter format tanpa migration
- 🚫 Remove hooks/entry points tanpa warning
- 🚫 Alter event handler contracts

Ketika ada change yang breaking:

- ✅ Buat migration function yang invertible
- ✅ Preserve optional hooks/entry points
- ✅ Update localStorage dengan versioning
- ✅ Log warning jika data di-migrate
- ✅ Provide rollback option jika memungkinkan

### **Konteks di My MapLibre App:**

#### **1. URL State Parameters** (src/utils/urlStateSync.js)

User bisa share URL dengan query params:

```
?year=2024&breadcrumbs=Bantul,Imogiri&selectedKab=Bantul
```

**Refactor HARUS:**

```javascript
// ✅ GOOD: Backward compatible migration
const parseUrlState = () => {
  const params = new URLSearchParams(window.location.search);

  // Dukung OLD format (2024) dan NEW format (2024-01-01)
  const year = params.get("year");
  const newYear = year?.includes("-")
    ? parseInt(year.split("-")[0])
    : parseInt(year);

  // Log jika URL format lama, guide user untuk re-share
  if (year && !year.includes("-")) {
    console.warn("URL format sudah di-update, silakan share ulang");
  }

  return { year: newYear /* ... */ };
};

// ❌ BAD: Breaking change
const parseUrlState = () => {
  // Baru require format ISO date, old format ?year=2024 jadi error
  const year = params.get("year").split("-")[0]; // CRASH jika year='2024'
};
```

#### **2. localStorage Cache Structure** (src/store/mapStore.js)

Sudah punya cache dengan TTL 2 hari:

```javascript
// Current format
const cacheEntry = {
  value: geoJsonData,
  expiresAt: Date.now() + 172800000,
};
```

**Refactor HARUS:**

```javascript
// ✅ GOOD: Migration dengan versioning
const getCacheValueWithMigration = (key) => {
  try {
    const stored = localStorage.getItem(`mapCache_${key}`);
    const cached = JSON.parse(stored);

    // Handle old format (no version) → migrate ke v2
    if (!cached.version) {
      console.log(`Migrating ${key} from v1 to v2...`);
      const migratedCache = {
        version: 2,
        value: cached.value || cached, // Old format langsung store data
        expiresAt: cached.expiresAt || Date.now() + 172800000,
      };
      localStorage.setItem(`mapCache_${key}`, JSON.stringify(migratedCache));
      return migratedCache.value;
    }

    return cached.value;
  } catch (error) {
    console.error(`Cache parse error for ${key}:`, error);
    return null;
  }
};

// ❌ BAD: Silent data loss
const getCache = (key) => {
  const cached = JSON.parse(localStorage.getItem(`mapCache_${key}`));
  return cached.value; // CRASH jika format lama, data hilang
};
```

#### **3. Zustand Store Schema** (src/store/mapLayerStore.js)

Jika perlu change store structure:

```javascript
// ✅ GOOD: Provide migration + keep old selectors
const useMapLayerStore = create((set, get) => ({
  // NEW structure
  layersTable: {}, // {id: {type, sourceId, ...}}

  // KEEP old selectors untuk backward compat
  getLayers: () => Object.values(get().layersTable),

  // Provide migration helper
  migrateFromV1: (oldLayers) => {
    const newTable = {};
    oldLayers.forEach((layer) => {
      newTable[layer.id] = { ...layer };
    });
    set({ layersTable: newTable });
  },
}));

// ❌ BAD: Breaking change
const useMapLayerStore = create((set) => ({
  // Langsung ubah structure, semua code yg pakai layers array jadi error
  layersTable: {},
}));
```

#### **4. MapLibre Event Handlers** (src/App.jsx, src/components/Map.jsx)

Event handlers yang di-depend aplikasi:

```javascript
// ✅ GOOD: Preserve event contracts
map.on("click", "kabupaten-fill", (e) => {
  // Contract: e.features[0] harus ada featureId
  const featureId = e.features[0].id; // Jangan ubah ini!
});

// Jika perlu tambah data:
map.on("click", "kabupaten-fill", (e) => {
  const feature = e.features[0];
  const featureId = feature.id; // KEEP for backward compat
  const featureName = feature.properties.name; // new field OK
});

// ❌ BAD: Breaking contract
map.on("click", "kabupaten-fill", (e) => {
  // Rename `id` jadi `featureId` di features
  const featureId = e.features[0].featureId; // Code lama: e.features[0].id jadi undefined!
});
```

#### **5. Export/API Contracts** (src/utils/\*.js)

Function yang di-export dari utilities:

```javascript
// ✅ GOOD: Keep old function, add better one
export const extractCoordinates = (geometry) => {
  // Original function, JANGAN ubah
};

// Jika ingin improve:
export const extractCoordinatesOptimized = (geometry) => {
  // Better version, but old one still works
};

// ❌ BAD: Remove old function
// const extractCoordinates = ... // DELETED!
// Code yang import ini langsung error
```

---

## **🔍 How to Apply Rule #4:**

### **Before Refactoring:**

- [ ] Identify data structures: URL params, localStorage keys, store schema
- [ ] Check usage: grep untuk semua yg depend pada struktur lama
- [ ] Plan migration: tulis migration function jika diperlukan
- [ ] Test: ensure old data bisa di-load dan di-convert ke baru

### **During Refactoring:**

- [ ] Keep old format readable untuk migration period
- [ ] Add version field ke localStorage/URL jika perlu track format
- [ ] Preserve old function names (buat wrapper ke baru jika perlu)
- [ ] Document what changed

### **After Refactoring:**

- [ ] Test dengan old cached data (simulate user dengan old cache)
- [ ] Test dengan old URL params
- [ ] Add console.warn jika auto-migrated data
- [ ] Keep migration code selama minimal 2-3 release cycles

---

## **📋 Complete Development Checklist**

Ketika coding, ensure:

- [ ] **Rule 1 - Newbie Friendly:**
  - [ ] Variable names deskriptif (no `a`, `b`, `x`)
  - [ ] Functions exported dan reusable
  - [ ] Constants dari `src/config/constants.js`

- [ ] **Rule 2 - Indonesian Comments:**
  - [ ] All comments dalam Bahasa Indonesia
  - [ ] Section dividers (`─── SECTION ───`)
  - [ ] Jelaskan WHY, bukan WHAT

- [ ] **Rule 3 - Meaningful Names:**
  - [ ] No abbreviations
  - [ ] Type hints (`is`, `Async`, suffix)
  - [ ] 50+ variable renames consistency check

- [ ] **Rule 4 - Data Integrity:** ⭐ NEW
  - [ ] No silent data loss
  - [ ] Backward compatible changes
  - [ ] Migration functions jika ada breaking changes
  - [ ] Test dengan old data format
  - [ ] Warn if data was auto-migrated

---

## **✅ Assessment: Apakah Make Sense?**

### **YES, HIGHLY MAKES SENSE untuk project kamu karena:**

1. **🌐 URL Sharing Feature**
   - User bisa share URL dengan query params
   - Kalau ubah format, old shared URLs jadi broken
   - Need backward compat untuk weeks/months

2. **💾 localStorage Caching (2-day TTL)**
   - User's cache data survive browser refresh
   - Kalau change cache structure, semua data hilang/error
   - Migration critical untuk user experience

3. **🔄 State Management (Zustand)**
   - Store schema mungkin berkembang
   - Code yg depend pada store bisa tersebar
   - Silent changes = hard to debug bugs

4. **📍 MapLibre Integration**
   - Event handlers depend pada feature properties
   - Changing event contract = breaking changes
   - Many handlers scattered across codebase

5. **🧩 Public API Contracts**
   - Utils di-export untuk internal + future extensions
   - Change function signature = break dependents
   - Invertible changes = safe refactoring

### **Real-World Example di Project:**

Bayangkan refactoring cache key format:

```javascript
// OLD: mapCache_gee_year=2024&kab=Bantul
// NEW: gee:2024:Bantul (lebih ringkas)

// TANPA Rule 4:
users.with.2day.old.cache.get.error() // CRASH!

// DENGAN Rule 4:
cache.migrate_old_to_new() // Silent upgrade ✅
cache.version_tracking() // Traceability
old.format.still_readable() // Rollback option
```

---

---

## **Rule 5: Correctness, Minimality & Edge Case Handling** ⭐ NEW

**Deskripsi (Critical untuk Quality):**

Setiap code modification HARUS:

- ✅ **Strictly Preserves Correctness** - Logic tetap benar, output sama, behavior tidak berubah
- ✅ **Minimality of Change** - Ubah minimal, fokus saja, jangan scope creep
- ✅ **Robustly Handles Edge Cases** - Anticipate null, undefined, empty, NaN, errors
- ✅ **Dalam Complex/Nested Structures** - Bahkan di code rumit, inherited, atau nested deep

### **1. Strictly Preserves Correctness**

Perubahan harus memastikan logic tetap benar tanpa changing behavior:

```javascript
// ❌ WRONG: Ubah logic, bukan cuma refactor
const fitBoundsToCoordinates = (mapInstance, coordinates) => {
  const lonValues = coordinates.map(([lon]) => lon);
  // BUG: Tidak validate, bisa NaN!
  const bounds = new maplibregl.LngLatBounds([
    Math.min(...lonValues),
    Math.min(...latValues),
  ]);
};

// ✅ CORRECT: Preserve logic + validate
const fitBoundsToCoordinates = (mapInstance, coordinates) => {
  if (coordinates.length === 0) return;

  // Validate sebelum process (edge case!)
  const validCoordinates = coordinates.filter(([lon, lat]) => {
    return (
      typeof lon === "number" &&
      typeof lat === "number" &&
      !isNaN(lon) &&
      !isNaN(lat)
    );
  });

  if (validCoordinates.length === 0) {
    console.warn("No valid coordinates");
    return;
  }

  // Same logic sebagai original, tapi lebih robust
  const lonValues = validCoordinates.map(([lon]) => lon);
  const latValues = validCoordinates.map(([, lat]) => lat);
  const bounds = new maplibregl.LngLatBounds([
    Math.min(...lonValues),
    Math.min(...latValues),
  ]);
};
```

### **2. Minimality of Change**

Ubah MINIMAL, jangan refactor yang tidak perlu (scope creep):

```javascript
// ❌ WRONG: Scope creep (ubah component structure juga)
const CoverageChart = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null); // NEW - tidak perlu!

  // Refactor entire useEffect
  useEffect(() => {
    /* ... */
  }, [year]);

  // Ubah UI juga!
  return error ? <ErrorBoundary /> : <Chart />;
};

// ✅ CORRECT: Hanya fix bug, jangan refactor
const CoverageChart = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`/api/coverage/${year}`);
        setData(await response.json());
      } catch (e) {
        console.error("Failed:", e);
        setData([]);
      }
    };
    loadData();
  }, [year]);

  return data ? <ReactECharts option={chartOption} /> : null;
};
```

### **3. Robustly Handles Edge Cases**

Anticipate: null, undefined, empty, NaN, duplicates, errors, boundaries:

```javascript
// ❌ WRONG: Tidak handle edge cases
const loadLayer = async (layerName) => {
  const cached = useMapStore.getCacheGeoJSON(`geojson_${layerName}`);
  if (cached) return cached;

  const response = await fetch(`/geoserver?layer=${layerName}`);
  const geoJsonData = await response.json(); // Could fail!

  map.addSource(layerName, { type: "geojson", data: geoJsonData });
  return geoJsonData;
};

// ✅ CORRECT: Handle edge cases robustly
const loadLayer = async (layerName) => {
  // EDGE CASE 1: Invalid input
  if (!layerName || typeof layerName !== "string") {
    console.error("Invalid layerName:", layerName);
    return null;
  }

  // EDGE CASE 2: Already loaded
  if (map.getSource(layerName)) {
    console.warn(`Layer ${layerName} already loaded`);
    return map.getSource(layerName)._data;
  }

  // EDGE CASE 3: Check cache
  const cached = useMapStore.getCacheGeoJSON(`geojson_${layerName}`);
  if (cached) return cached;

  try {
    // EDGE CASE 4: Network error
    const response = await fetch(`/geoserver?layer=${layerName}`);
    if (!response.ok) throw new Error(`Server ${response.status}`);

    const geoJsonData = await response.json();

    // EDGE CASE 5: Invalid GeoJSON
    if (!geoJsonData?.features) {
      console.error("Invalid GeoJSON");
      return null;
    }

    // EDGE CASE 6: Empty features
    if (geoJsonData.features.length === 0) {
      console.warn(`Layer ${layerName} empty`);
    }

    map.addSource(layerName, { type: "geojson", data: geoJsonData });
    return geoJsonData;
  } catch (error) {
    // EDGE CASE 7: Graceful error
    console.error(`Failed to load ${layerName}:`, error);
    return null;
  }
};
```

### **4. Complex & Nested Structures**

Respect nesting, immutability, inheritance:

```javascript
// ❌ WRONG: Direct mutation (breaks immutability!)
const useMapLayerStore = create((set) => ({
  layers: [{ id: "layer1", paint: {} }],

  updateColor: (id, color) =>
    set((state) => {
      state.layers[0].paint = { "fill-color": color }; // WRONG!
      return state;
    }),
}));

// ✅ CORRECT: Immutable nested updates
const useMapLayerStore = create((set) => ({
  layers: [{ id: "layer1", paint: {} }],

  updateColor: (id, color) =>
    set((state) => {
      const index = state.layers.findIndex((l) => l.id === id);
      if (index === -1) {
        console.warn(`Layer ${id} not found`);
        return state;
      }

      // Immutable: new array + new object
      return {
        layers: state.layers.map((layer, i) => {
          if (i === index) {
            return {
              ...layer,
              paint: { ...(layer.paint || {}), "fill-color": color },
            };
          }
          return layer;
        }),
      };
    }),
}));
```

---

## **Rule 6: Performance & Optimization Awareness** ⭐ NEW

**Deskripsi (Critical untuk UX):**

Setiap refactoring, feature, atau bugfix HARUS mempertimbangkan:

- ✅ **React Performance** - Hindari unnecessary re-renders
- ✅ **MapLibre Efficiency** - Manage layers & events properly
- ✅ **Data Optimization** - Lazy load, paginate, cache smart
- ✅ **Memory Management** - Cleanup resources, prevent leaks
- ✅ **Bundle Size** - Tree-shake, don't import unused

### **1. React Performance - Selective Subscriptions**

```javascript
// ❌ WRONG: Subscribe to semua state (unnecessary re-renders)
const CoverageChart = () => {
  // Chart re-render saat year OR breadcrumb berubah
  const year = useMapStore((state) => state.year);
  const breadcrumbs = useMapStore((state) => state.breadcrumbs);
  const selectedKab = useMapStore((state) => state.selectedKab);

  return <ReactECharts option={chartOption} />; // Re-render setiap state change
};

// ✅ CORRECT: Subscribe selective (only what needed)
const CoverageChart = () => {
  // Chart hanya re-render saat year berubah
  const year = useMapStore((state) => state.year);

  // Memoize expensive calculation
  const chartOption = useMemo(() => {
    return buildChartOption(year);
  }, [year]);

  return <ReactECharts option={chartOption} />;
};
```

### **2. MapLibre Efficiency - Avoid Duplicate Layers**

```javascript
// ❌ WRONG: Add layer setiap render (inefficient!)
const Map = () => {
  useEffect(() => {
    // This runs multiple times if deps wrong
    map.addLayer({
      id: "hover-layer",
      type: "line",
      source: "source-id",
    });
  }); // No dependency array - runs every render!
};

// ✅ CORRECT: Add once, manage lifecycle
const Map = () => {
  useEffect(() => {
    // Only add if not exists
    if (!map.getLayer("hover-layer")) {
      map.addLayer({
        id: "hover-layer",
        type: "line",
        source: "source-id",
        paint: { "line-color": COLORS.HOVER },
      });
    }

    // Cleanup on unmount
    return () => {
      if (map.getLayer("hover-layer")) {
        map.removeLayer("hover-layer");
      }
    };
  }, []); // Empty deps = run only once on mount
};
```

### **3. Data Optimization - Lazy Load by Level**

```javascript
// ❌ WRONG: Load all levels at startup (slow!)
const loadAllData = async () => {
  // User waits for ALL before seeing map
  const kabupaten = await fetch("/geoserver?layer=kabupaten");
  const kecamatan = await fetch("/geoserver?layer=kecamatan");
  const desa = await fetch("/geoserver?layer=desa");
};

// ✅ CORRECT: Load on demand (lazy)
const loadLayerOnDemand = async (level) => {
  // Only load when user navigates to that level
  const cached = useMapStore.getCacheGeoJSON(`geojson_${level}`);
  if (cached) return cached;

  const response = await fetch(`/geoserver?layer=${level}`);
  return response.json();
};

// Usage: Call hanya saat user drill down
map.on("click", "kabupaten-fill", async (e) => {
  const kabupatenName = e.features[0].properties.name;

  // Load kecamatan hanya untuk kabupaten ini
  await loadLayerOnDemand(`kecamatan_${kabupatenName}`);
});
```

### **4. Memory Management - Cleanup Resources**

```javascript
// ❌ WRONG: Memory leak (listener never removed)
const Map = () => {
  useEffect(() => {
    map.on("click", "kabupaten-fill", handleCabupatenClick);
    // No cleanup!
  }, []);
};

// ✅ CORRECT: Cleanup on unmount
const Map = () => {
  useEffect(() => {
    // Define handler once
    const handleClick = (e) => {
      const featureId = e.features[0].id;
      useMapStore.selectKabupaten(featureId);
    };

    // Add listener
    map.on("click", "kabupaten-fill", handleClick);

    // Cleanup: remove listener when component unmounts
    return () => {
      map.off("click", "kabupaten-fill", handleClick);
    };
  }, []);

  // Also cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove map entirely (if using useRef)
      if (map) {
        map.remove();
      }
    };
  }, []);
};
```

### **5. Bundle Size - Tree-shakeable Imports**

```javascript
// ❌ WRONG: Import entire icon library (unused code)
import * as LucideIcons from "lucide-react";

function MapControls() {
  // Only using 3 icons, but all 1700+ imported!
  return (
    <>
      <LucideIcons.MapPin size={24} />
      <LucideIcons.ZoomIn size={24} />
      <LucideIcons.Settings size={24} />
    </>
  );
}

// ✅ CORRECT: Tree-shakeable specific imports
import { MapPin, ZoomIn, Settings } from "lucide-react";

function MapControls() {
  // Only 3 icons in bundle
  return (
    <>
      <MapPin size={24} />
      <ZoomIn size={24} />
      <Settings size={24} />
    </>
  );
}
```

### **6. Caching Strategy (Already Good!)**

```javascript
// ✅ ALREADY IMPLEMENTED: Smart cache strategy
// 1. Check Zustand memory cache (instant)
// 2. Check localStorage (2-day TTL)
// 3. Check if request pending (avoid duplicate)
// 4. Fetch from API (network)

const loadGEE = async (year, filters) => {
  const cacheKey = `gee_year=${year}&...`;

  // Level 1: In-memory Zustand cache
  const cached = useMapStore.getCacheGEE(cacheKey);
  if (cached) return cached;

  // Level 2: localStorage with TTL
  const localCached = getCacheFromLocalStorage(cacheKey);
  if (localCached && !isExpired(localCached)) {
    useMapStore.setCacheGEE(cacheKey, localCached.value);
    return localCached.value;
  }

  // Level 3: Deduplication - check if request pending
  const pending = useMapStore.getPendingRequest(cacheKey);
  if (pending) return pending; // Don't fetch again!

  // Level 4: Fetch from API
  const promise = fetch(`/gee?year=${year}&...`)
    .then((r) => r.json())
    .then((data) => {
      useMapStore.setCacheGEE(cacheKey, data);
      setCacheToLocalStorage(cacheKey, data);
      useMapStore.removePendingRequest(cacheKey);
      return data;
    });

  useMapStore.setPendingRequest(cacheKey, promise);
  return promise;
};
```

---

## **📋 Performance Checklist**

```
React:
  [ ] useMemo untuk expensive calculations
  [ ] useCallback untuk stable function references
  [ ] Selective Zustand subscriptions
  [ ] React.memo untuk heavy components

MapLibre:
  [ ] Check layer exists before addLayer
  [ ] Cleanup layers/listeners on unmount
  [ ] Use setFeatureState (efficient styling)
  [ ] Don't re-create layers on re-render

Data:
  [ ] Lazy load by user interaction
  [ ] Cache + TTL (have 2-day TTL)
  [ ] Request deduplication (have it!)
  [ ] Pagination untuk large datasets

Bundle:
  [ ] Tree-shakeable imports (lucide)
  [ ] No unused dependencies
  [ ] Code splitting if needed (future)

Memory:
  [ ] Remove event listeners on unmount
  [ ] Cleanup timers/intervals
  [ ] Call map.remove() on cleanup
  [ ] No circular references in store
```

---

## **🎓 Summary**

| Rule                | Fokus                       | Status       |
| ------------------- | --------------------------- | ------------ |
| 1️⃣ Newbie Friendly  | Code clarity                | ✅ Applied   |
| 2️⃣ Indonesian       | Comments                    | ✅ Applied   |
| 3️⃣ Meaningful Names | Naming                      | ✅ Applied   |
| 4️⃣ Data Integrity   | Backward compat             | ✅ Applied   |
| 5️⃣ Correctness      | Quality & Safety            | ✅ Applied   |
| 6️⃣ Performance      | **Optimization & UX (NEW)** | ⭐ **ADDED** |

**All 6 Rules = Professional, maintainable, high-performance code!**

---

**Catatan:**

- Rules inspired dari React/Next.js + professional software practices
- Best practices untuk apps dengan shared state & user data integrity
- Minimizes bugs, simplifies debugging, improves code quality
