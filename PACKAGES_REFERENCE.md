# Packages Reference Guide

Dokumentasi quick reference untuk semua packages yang digunakan di My MapLibre App.

**Last Updated:** February 2026

---

## 📦 Main Dependencies

### React 19.1.1

**Docs:** https://react.dev

**Konsep Utama:**

- Components (function-based + hooks)
- JSX (HTML-like syntax di JavaScript)
- State management (useState)
- Side effects (useEffect)
- Context (useContext)

**Common Hooks:**

```javascript
import { useState, useEffect, useContext } from "react";

// State management
const [count, setCount] = useState(0);

// Side effects
useEffect(() => {
  // Run on mount/dependency change
  return () => {
    // Cleanup on unmount
  };
}, [dependencies]);

// Context
const value = useContext(MyContext);
```

**Tips:**

- React 19 punya improvements untuk concurrency
- Server Components support (untuk Next.js)
- Rules of Hooks: hanya di components, harus di top-level

---

### MapLibre GL 5.8.0

**Docs:** https://maplibre.org/maplibre-gl-js/docs/

**Main API:**

```javascript
import maplibregl from "maplibre-gl";

// Create map
const map = new maplibregl.Map({
  container: "map-container",
  style: "https://api.maptiler.com/maps/dataviz-light/style.json",
  center: [120.216667, -1.5],
  zoom: 4,
});

// Add layer
map.addLayer({
  id: "layer-id",
  type: "fill",
  source: "source-id",
  paint: { "fill-color": "#088" },
});

// Add source
map.addSource("source-id", {
  type: "geojson",
  data: geojsonData,
});

// Events
map.on("click", "layer-id", (e) => {
  console.log(e.features[0]);
});
```

**Common Events:**

- `load` - Map initialized
- `click` - Mouse click
- `mousemove` - Mouse movement
- `zoom` - Zoom change
- `error` - Layer/source error

**Layer Types:**

- `fill` - Polygon fill
- `line` - Line stroke
- `symbol` - Text/icons
- `raster` - Raster tiles
- `circle` - Circle points

**Tips:**

- Always check `map.getSource()` before using source
- Layer removal order: hover layer → fill layer → source
- Use `setFeatureState()` untuk interactive styling

---

### Zustand 5.0.8

**Docs:** https://github.com/pmndrs/zustand

**Basic Store Creation:**

```javascript
import { create } from "zustand";

const useMapStore = create((set, get) => ({
  // State
  bears: 0,
  year: 2024,

  // Actions
  increasePopulation: () =>
    set((state) => ({
      bears: state.bears + 1,
    })),

  setYear: (year) => set({ year }),

  // Read state (non-reactive)
  getBears: () => get().bears,
}));

// Use in components
function Component() {
  const bears = useMapStore((state) => state.bears);
  const increase = useMapStore((state) => state.increasePopulation);
  return <button onClick={increase}>{bears}</button>;
}
```

**Advanced Patterns:**

```javascript
// Subscribe to changes
const unsub = useMapStore.subscribe(
  (state) => state.bears,
  (bears) => console.log('Bears:', bears)
)

// Get state outside component
const currentBears = useMapStore.getState().bears

// Update state directly
useMapStore.setState({ bears: 10 })

// Middleware: persist
import { persist, createJSONStorage } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({ ... }),
    {
      name: 'store-name',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
```

**Tips:**

- No providers needed (unlike Redux)
- Only updates on selector changes (efficient)
- Use `useShallow` untuk object/array picks
- Async actions supported naturally

---

### Tailwind CSS 4.1.13

**Docs:** https://tailwindcss.com/docs

**Setup (Already Done):**

```javascript
// vite.config.js
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
})

// App.css
@import "tailwindcss"
```

**Common Utilities:**

```html
<!-- Spacing -->
<div class="p-4 m-8">Padding & margin</div>

<!-- Colors -->
<div class="text-blue-500 bg-red-100">Colors</div>

<!-- Responsive -->
<div class="text-sm md:text-base lg:text-lg">Responsive</div>

<!-- Flexbox -->
<div class="flex justify-center items-center w-full h-screen">Centered</div>

<!-- Grid -->
<div class="grid grid-cols-3 gap-4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>

<!-- Dark mode -->
<div class="dark:bg-slate-900 dark:text-white">Dark</div>
```

**Tips:**

- Utility-first approach (no custom CSS needed)
- Responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Dark mode: use `dark:` prefix
- No runtime overhead

---

### ECharts 6.0.0 + echarts-for-react 3.0.5

**Docs:** https://echarts.apache.org/en/index.html

**Basic Usage:**

```javascript
import ReactECharts from "echarts-for-react";

const MyChart = () => {
  const option = {
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: [120, 200, 150],
        type: "bar",
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "400px" }} />;
};
```

**Chart Types:**

- `bar` - Bar chart
- `line` - Line chart
- `pie` - Pie chart
- `scatter` - Scatter plot
- `gauge` - Gauge chart
- `heatmap` - Heat map
- `map` - Geographic data

**Common Options:**

```javascript
{
  title: { text: 'Chart Title' },
  tooltip: { trigger: 'axis' },
  legend: { data: ['Series 1', 'Series 2'] },
  xAxis: { type: 'category', data: [] },
  yAxis: { type: 'value' },
  series: [{ data: [], type: 'bar' }],
  grid: { left: '3%', right: '4%', top: '15%', bottom: '10%' }
}
```

**Tips:**

- Canvas rendering (default) faster for large datasets
- SVG rendering for accessibility
- Responsive: set container height, auto-scales width
- `notMerge: true` untuk replace data fully

---

### @turf/turf 7.2.0

**Docs:** https://turfjs.org/docs

**GeoJSON Geometry Analysis:**

```javascript
import {
  distance,
  bbox,
  area,
  centroid,
  buffer,
  booleanPointInPolygon,
} from "@turf/turf";

// Calculate distance between points (in kilometers)
const dist = distance([0, 0], [1, 1]); // km

// Get bounding box
const bounds = bbox(polygon); // [minLon, minLat, maxLon, maxLat]

// Calculate area (in square meters)
const polygonArea = area(polygon); // m²

// Get center point
const center = centroid(polygon);

// Create buffer around feature
const buffered = buffer(polygon, 10, { units: "kilometers" });

// Check if point is inside polygon
const isInside = booleanPointInPolygon(point, polygon);
```

**Common Features:**

- Geometric calculations
- Data transformation
- Spatial analysis
- GeoJSON manipulation

**Tips:**

- GeoJSON format: `{ type: 'Feature', geometry: {...}, properties: {...} }`
- Coordinates: `[longitude, latitude]` (not lat, lon!)
- Works in browser + Node.js
- All functions accept GeoJSON objects

---

### lucide-react 0.545.0

**Docs:** https://lucide.dev

**Usage:**

```javascript
import { MapPin, ZoomIn, Settings, Home } from "lucide-react";

export function MapControls() {
  return (
    <div className="flex gap-2">
      <MapPin size={24} className="text-blue-500" />
      <ZoomIn size={24} className="hover:text-red-500" />
      <Settings size={24} strokeWidth={1.5} />
    </div>
  );
}
```

**Common Props:**

```javascript
<Icon
  size={24} // Default: 24px
  color="currentColor" // SVG color
  strokeWidth={2} // Line width
  className="text-blue" // Tailwind classes
/>
```

**Available Icons:**

- Navigation: MapPin, Navigation, Map, Compass
- UI: Settings, Menu, Search, Home, User
- Arrows: ArrowUp, ArrowDown, ChevronLeft, ChevronRight
- Data: Database, Cloud, Download, Upload
- [Full list: https://lucide.dev/icons](https://lucide.dev/icons)

**Tips:**

- Tree-shakable (only import what you use)
- Responsive sizing: `size={isMobile ? 20 : 24}`
- Consistent design with 2px stroke width
- Perfect for map controls

---

### Additional DevDependencies

**Vite 7.1.7** - Build tool

- Fast dev server (ES modules)
- Optimized production builds
- Plugin ecosystem

**ESLint 9.36.0** - Code linting

```bash
npm run lint  # Check code quality
```

**React Refresh** - Hot module reload

- Auto-refresh on code changes
- Preserves component state

---

## 🔗 Quick Links

| Package      | Version | Docs                                                           | Purpose             |
| ------------ | ------- | -------------------------------------------------------------- | ------------------- |
| react        | 19.1.1  | [react.dev](https://react.dev)                                 | UI Framework        |
| maplibre-gl  | 5.8.0   | [maplibre.org](https://maplibre.org/maplibre-gl-js/docs/)      | Interactive Maps    |
| zustand      | 5.0.8   | [GitHub](https://github.com/pmndrs/zustand)                    | State Management    |
| tailwindcss  | 4.1.13  | [tailwindcss.com](https://tailwindcss.com/docs)                | Styling             |
| echarts      | 6.0.0   | [echarts.apache.org](https://echarts.apache.org/en/index.html) | Data Visualization  |
| @turf/turf   | 7.2.0   | [turfjs.org](https://turfjs.org/docs)                          | Geospatial Analysis |
| lucide-react | 0.545.0 | [lucide.dev](https://lucide.dev)                               | Icon Library        |

---

## 📚 Indonesian Code Examples

### React Hook Pattern

```javascript
// Mengambil data geografis dan cache
const useCoverageData = (year) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dari cache atau API
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/coverage/${year}`);
        setData(await response.json());
      } catch (error) {
        console.error("Error fetching:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year]);

  return { data, loading };
};
```

### Zustand Store Pattern

```javascript
// Store untuk managemen layer peta
const useMapLayerStore = create((set, get) => ({
  layers: [],
  hoverId: null,

  // Tambah layer baru
  addLayer: (layerId, sourceId) =>
    set((state) => ({
      layers: [...state.layers, { id: layerId, sourceId }],
    })),

  // Set hover state
  setHoverId: (id) => set({ hoverId: id }),

  // Get total layers
  getLayerCount: () => get().layers.length,
}));
```

### Tailwind Responsive Layout

```jsx
// Layout yang responsive (desktop → mobile)
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="col-span-1 md:col-span-2">
    {/* Map: 2 columns on desktop, 1 on mobile */}
    <Map />
  </div>
  <div className="col-span-1">
    {/* Sidebar: full width on mobile */}
    <Controls />
  </div>
</div>
```

---

## ✅ Development Checklist

Ketika membuat features baru:

- [ ] React: Gunakan functional components + hooks
- [ ] MapLibre: Check `map.getSource()` sebelum manipulasi
- [ ] Zustand: Selalu gunakan selectors untuk re-render efficiency
- [ ] Tailwind: Gunakan utility classes, jangan custom CSS
- [ ] ECharts: Set container height, handle responsive
- [ ] Turf: Remember coordinates = `[lon, lat]`
- [ ] Icons: Import dari lucide-react, use className untuk styling

---

## 🚀 Next Steps

Ketika membangun features baru:

1. **Plan state** dengan Zustand
2. **Create components** dengan React hooks
3. **Style dengan Tailwind** (no custom CSS!)
4. **Add interactions** dengan MapLibre events
5. **Visualize data** dengan ECharts
6. **Spatial analysis** dengan Turf jika diperlukan
7. **Use icons** dari Lucide untuk UI consistency

---

**Catatan:** File ini adalah referensi lokal. Untuk dokumentasi lengkap, lihat link di atas.
