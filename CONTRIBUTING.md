// CONTRIBUTING.md

# 🚀 Contributing Guide untuk Developer Baru

Selamat datang! Panduan ini membantu you understand dan contribute ke project.

## 📋 Sebelum Mulai

**Baca dulu:**

1. [ARCHITECTURE_GUIDE.md](ARCHITECTURE_GUIDE.md) - Understand structure & data flow
2. README.md - High-level overview

## 🛠️ Setup Development Environment

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open di browser
# http://localhost:5173
```

## 📁 File Structure Quick Reference

| Folder            | Gunakan untuk                     | Contoh                                 |
| ----------------- | --------------------------------- | -------------------------------------- |
| `src/config/`     | Constants & configuration         | `LAYER_IDS`, `COLORS`, `API_ENDPOINTS` |
| `src/utils/`      | Helper functions & business logic | `mapDrilldown.js`, `filterBuilder.js`  |
| `src/store/`      | Zustand state stores              | `mapStore.js`, `mapLayerStore.js`      |
| `src/components/` | React UI components               | `Map.jsx`, `TimeSelector.jsx`          |
| `src/data/`       | Static data                       | `kabupatens.js`                        |

## 🎯 Common Tasks

### Task 1: Add New Constant

**Where:** `src/config/constants.js`

```javascript
// BAD: Magic numbers scattered everywhere
const padding = 100;
map.fitBounds(bounds, { padding });

// GOOD: Constant yang reusable & documented
export const MAP_PADDING = 100;

// Usage
import { MAP_PADDING } from "../config/constants.js";
map.fitBounds(bounds, { padding: MAP_PADDING });
```

### Task 2: Add New Filter Function

**Where:** `src/utils/filterBuilder.js`

```javascript
// Template
export const buildMyFilter = (params) => {
  // Validate
  if (!params.kab) return "";

  // Build CQL filter
  return `kab='${params.kab}'`;
};

// Usage
import { buildMyFilter } from "../utils/filterBuilder.js";
const filter = buildMyFilter({ kab: "Bantul" });
// Result: "kab='Bantul'"
```

### Task 3: Add New Layer

**Where:** `src/config/constants.js` + `src/store/mapLayerStore.js`

**Step 1:** Add constants

```javascript
// constants.js
export const LAYER_IDS = {
  // ... existing
  MY_LAYER_FILL: "my-layer-fill",
};

export const SOURCE_IDS = {
  // ... existing
  MY_LAYER: "my-layer-src",
};
```

**Step 2:** Load the layer

```javascript
// mapLayerStore.js
import { LAYER_IDS, SOURCE_IDS } from "../config/constants.js";

await loadLayer(
  map,
  "LTKL:my-layer",
  SOURCE_IDS.MY_LAYER,
  LAYER_IDS.MY_LAYER_FILL,
  "filter=value",
);
```

### Task 4: Change Colors/Styling

**Where:** `src/config/constants.js`

```javascript
export const COLORS = {
  HIGHLIGHT: "#27CBFC",
  PRIMARY: "#14b8a6",
  // Add your color here
  SECONDARY: "#ff6b6b",
};
```

Then use everywhere:

```javascript
import { COLORS } from '../config/constants.js';

className={`bg-[${COLORS.SECONDARY}]`}
```

## 🧪 Testing Your Changes

### Test API Calls

```javascript
// Browser console
const result = await fetch("https://aws.simontini.id/geoserver/ows?...");
const data = await result.json();
console.log(data); // Check response format
```

### Test State Changes

```javascript
// Browser console
import { useMapStore } from "./store/mapStore.js";

// See current state
useMapStore.getState();

// Change state
useMapStore.getState().setYear(2023);

// See updated state
useMapStore.getState().year; // 2023
```

### Test Caching

```javascript
// Check what's cached
localStorage.getItem("mapCache_gee");
localStorage.getItem("mapCache_geojson");

// Clear cache manually
localStorage.removeItem("mapCache_gee");
localStorage.removeItem("mapCache_geojson");
```

## 🐛 Debugging Tips

### Check Layer Status

```javascript
// Browser console
const map = /* get map instance */;

// See all layers
map.getStyle().layers.map(l => l.id);

// Check specific layer
map.getLayer('kabupaten-fill');

// Check specific source
map.getSource('kabupaten-src');
```

### Check Zustand State

```javascript
// Browser console
import { useMapStore } from "./store/mapStore.js";
import { useMapLayerStore } from "./store/mapLayerStore.js";

// See all state
useMapStore.getState();
useMapLayerStore.getState();

// See specific property
useMapStore.getState().breadcrumbs;
useMapStore.getState().year;
```

### Monitor Network Requests

- Open DevTools → Network tab
- Filter by `geoserver` untuk WFS calls
- Filter by `simontini` untuk API calls
- Check response format & status codes

## ❌ Common Mistakes

### ❌ Don't: Hardcode magic numbers

```javascript
// BAD
const zoom = 4;
const padding = 100;
const color = "#27CBFC";
```

### ✅ Do: Use constants

```javascript
// GOOD
import { MAP_CONFIG, MAP_PADDING, COLORS } from "../config/constants.js";
```

---

### ❌ Don't: Build filters manually

```javascript
// BAD
const filter = `kab='${kab}' AND kec='${kec}'`;
```

### ✅ Do: Use filterBuilder

```javascript
// GOOD
import { buildKecamatanFilter } from "../utils/filterBuilder.js";
const filter = buildKecamatanFilter({ kab, kec });
```

---

### ❌ Don't: Forgot to update URL after state change

```javascript
// BAD
useMapStore.setState({ year: 2023 });
// URL di-ignore!
```

### ✅ Do: Use setYear() dari store

```javascript
// GOOD
useMapStore.getState().setYear(2023);
// Automatically update URL!
```

---

### ❌ Don't: Remove layer/source dalam wrong order

```javascript
// BAD
map.removeSource(sourceId); // Error! Layer still using it
map.removeLayer(layerId);
```

### ✅ Do: Remove in correct order

```javascript
// GOOD
map.removeLayer(layerId);
map.removeSource(sourceId);
```

## 📚 Useful Links

- [MapLibre GL Documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Documentation](https://react.dev)
- [GeoServer WFS Guide](https://geoserver.org/getstarted/web-reporting/)

## 🤝 Pull Request Checklist

Before submitting PR:

- [ ] Code follows patterns dalam existing code
- [ ] Used constants dari `config/constants.js` (tidak hardcode)
- [ ] Used filterBuilder untuk WFS filters
- [ ] Updated URL setelah state changes
- [ ] Tested di browser
- [ ] No console errors/warnings
- [ ] Added comments untuk complex logic
- [ ] Function punya JSDoc comments

## 💬 Questions?

- Check ARCHITECTURE_GUIDE.md
- Check existing similar code
- Read comments dalam source files
- Test things di browser console

Happy coding! 🎉
