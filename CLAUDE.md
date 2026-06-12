# CLAUDE.md — Web (Public Website)

> **Keep this file up to date.** When you change the tech stack, add stores/utils, modify map patterns, update external services, or alter the architecture — update this file in the same commit.

## Stack

- **Framework**: React 19 + Vite 7
- **Language**: JSX (plain JavaScript, no TypeScript)
- **Styling**: Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- **Maps**: MapLibre GL JS 5
- **Charts**: ECharts 6 via `echarts-for-react`
- **Geo utilities**: Turf.js 7
- **State**: Zustand 5
- **Routing**: react-router-dom 7
- **Data fetching**: SWR 2
- **Icons**: lucide-react
- **D3 modules**: d3-sankey
- **Test runner**: none (no test files in web/)

## Commands

```bash
npm run dev          # vite (port 3000)
npm run build        # vite build
npm run lint         # eslint
npm run format       # prettier --write
npm run format:check # prettier --check
npm run build:supplychain # regenerate supplychain-data.json from palmoil.csv
```

## Directory Structure

```
web/src/
├── App.jsx               # Root component + routing
├── main.jsx              # React root mount
├── components/
│   ├── ErrorBoundary.jsx # Error isolation component
│   ├── LeftPanel.jsx     # Sidebar (kabupaten list, breadcrumbs)
│   ├── RightPanel.jsx    # Map container
│   ├── ProfilePage.jsx   # Kabupaten profile page
│   ├── map/              # Map-specific components
│   ├── profile/          # Profile tab components
│   └── ui/               # Shared UI primitives
├── config/
│   └── constants.js      # ALL constants (API endpoints, colors, layer IDs)
├── data/                 # Static data files (kabupatens.js)
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── pages/                # Route-level page components
├── store/
│   ├── mapLayerStore.js  # Map layer state + activeController (AbortController)
│   └── mapStore.js       # General map state (breadcrumbs, year, etc.)
├── utils/
│   ├── dataTransform.js  # Server response normalization
│   ├── filterBuilder.js  # CQL/WFS filter construction
│   ├── mapDrilldown.js   # Breadcrumb drill-down logic
│   ├── mapTransitionController.js # Main map transition orchestration
│   ├── mapUtils.js       # General map utilities
│   └── urlStateSync.js   # URL ↔ state synchronization
```

## Critical Rules

### Rule 1: No `new AbortController()` in components

Always use the module-level `activeController` from `mapLayerStore.js`:

```js
// ✅ Correct
import { abortActiveRequests } from './store/mapLayerStore.js';
abortActiveRequests();
const response = await fetch(url, { signal: activeController.signal });

// ❌ Wrong
const controller = new AbortController();
```

### Rule 2: Zustand Subscriptions

```js
// 1 field → individual selector
const year = useMapStore((state) => state.year);

// 2+ fields → useShallow
import { useShallow } from 'zustand/react/shallow';
const { year, setYear } = useMapStore(useShallow((state) => ({ year: state.year, setYear: state.setYear })));

// Outside React → getState()
useMapStore.getState().setYear(2024);
```

### Rule 3: Layer Removal Order

MapLibre requires removing in this order:
1. Hover-line layer
2. Fill layer
3. Source

Removing source first causes MapLibre errors.

### Rule 4: Event-Driven Waits

```js
// ✅ Correct — event-driven
await waitForSourceData(map, sourceId);

// ❌ Wrong — hardcoded delay
await new Promise((resolve) => setTimeout(resolve, 200));
```

### Rule 5: Constants from `constants.js`

No magic strings or numbers in components. All API endpoints, colors, layer IDs, and configuration values must come from `src/config/constants.js`.

### Rule 6: No Logic Duplication

If the same pattern appears in 2+ places, extract to a shared helper in `utils/`. Check `utils/` and `store/` before writing new logic.

## Data Flow

```
URL params → parseUrlState() → useMapStore.setState() → useEffect → loadLayers()
User click → attachLayerInteraction → updateBreadcrumb() → handleBreadcrumbDrill() → load next level
Year change → setYear() → updateUrl() → loadGEEPolygonRaster() with new filter
```

## Cache Strategy (Three-Tier)

```
In-memory (Zustand) → localStorage → Pending request dedup → Fetch from API
```

## External Services

- **GeoServer WFS**: `https://aws.simontini.id/geoserver/ows` — admin boundary GeoJSON
- **GEE Tile Server**: `$VITE_TILE_SERVER` env var — LULC raster tiles + `/lulc-stats`

Both are external and already running. Do not modify their endpoints.

## Error Boundaries

`ErrorBoundary.jsx` is defined in `src/components/`. Used to wrap independent areas:
- `LeftPanel` (sidebar — crash doesn't affect map)
- `RightPanel` (map — crash doesn't affect sidebar)
- Profile tab content (individual tabs can crash independently)

Error boundaries only catch render-phase errors. Async errors use try/catch + loading/error state per component.

## Environment Variables

```
VITE_TILE_SERVER    # GEE tile server base URL
```

Accessed via `import.meta.env.VITE_TILE_SERVER`.

## Race Condition Prevention

### Rule 1: All async map interaction handlers must have a re-entry guard

```js
// ❌ Wrong — rapid clicks interleave addSource/removeSource on same layers
async function handleDrillDown(feature) {
  await removeLayerAndSource(map, LAYER_IDS.KABUPATEN_FILL);
  await loadLayer(map, ...);
}

// ✅ Correct — abort previous then proceed, or use a lock ref
const isDrilling = useRef(false);
async function handleDrillDown(feature) {
  if (isDrilling.current) return;
  isDrilling.current = true;
  try {
    abortActiveRequests();
    await removeLayerAndSource(map, LAYER_IDS.KABUPATEN_FILL);
    await loadLayer(map, ...);
  } finally {
    isDrilling.current = false;
  }
}
```

Applies to: `store/mapLayerStore.js` (`handleGlobalDrillDown`), `utils/mapDrilldown.js` (`handleBreadcrumbDrill`), `components/map/KabupatensList.jsx` (`handleKabupatenClick`), `components/map/TimeSelector.jsx` (`handleChange`), `components/profile/MapTab.jsx` (year effect).

### Rule 2: Every long-lived promise listener must be cleaned up

```js
// ❌ Wrong — waitForSourceData listener never removed on abort
map.on('sourcedata', handler);  // leaks when source removed before event fires

// ✅ Correct — always clean up with AbortSignal or explicit off()
async function waitForSourceData(map, sourceId, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    function onData(e) {
      if (e.sourceId === sourceId) {
        map.off('sourcedata', onData);
        resolve();
      }
    }
    signal?.addEventListener('abort', () => {
      map.off('sourcedata', onData);
      reject(new DOMException('Aborted', 'AbortError'));
    });
    map.on('sourcedata', onData);
  });
}
```

Applies to: `utils/mapUtils.js` `waitForSourceData`. Also applies to `map.on('load', ...)` in `components/map/KabupatensList.jsx`.

### Rule 3: Effects with async map operations that can overlap must check isEffectActive before every await

```js
// ❌ Wrong — isEffectActive only checked in .finally()
useEffect(() => {
  let isEffectActive = true;
  async function load() {
    await loadLayerWithCallback(map, ...);  // completes
    await zoomToCollection(map, ...);        // runs even if cleanup fired!
    await loadGEEPolygonRaster(map, ...);    // races with new effect
  }
  load();
  return () => { isEffectActive = false; };
}, [breadcrumbs]);

// ✅ Correct — check before every async step
useEffect(() => {
  let isEffectActive = true;
  async function load() {
    await loadLayerWithCallback(map, ...);
    if (!isEffectActive) return;
    await zoomToCollection(map, ...);
    if (!isEffectActive) return;
    await loadGEEPolygonRaster(map, ...);
  }
  load();
  return () => { isEffectActive = false; };
}, [breadcrumbs]);
```

Applies to: `components/profile/MapTab.jsx` (breadcrumb effect), `components/map/Map.jsx` (breadcrumb effect).

### Rule 4: Each independent feature needs its own AbortController

```js
// ❌ Wrong — three CoverageChart instances share one statsController,
// each cleanup aborts the others' fetches
const statsController = new AbortController();  // module-level, shared

// ✅ Correct — charts manage their own controllers
// Option A: per-component controller (ref inside component)
function CoverageChart() {
  const controllerRef = useRef(null);
  useEffect(() => {
    controllerRef.current = new AbortController();
    return () => controllerRef.current?.abort();
  }, [year]);
  // use controllerRef.current.signal for fetch
}

// Option B: family of controllers with unique keys in the store
const statsControllers = {};
function getStatsController(key) {
  statsControllers[key]?.abort();
  statsControllers[key] = new AbortController();
  return statsControllers[key];
}
```

Applies to: `store/mapLayerStore.js` (`statsController`), `components/map/CoverageChart.jsx`, `components/RightPanel.jsx`.

### Rule 5: `waitForSourceData` must reject when the source is removed or map destroyed

```js
// The current implementation creates a promise that hangs forever if the
// source is removed before 'sourcedata' fires. Must add:
// 1. AbortSignal support (for abortActiveRequests)
// 2. Timeout as fallback
// 3. Map 'removesource' event listener to detect source removal
```

Applies to: `utils/mapUtils.js` `waitForSourceData`.

### Rule 6: Map event listeners must be removed in cleanup

```jsx
// ❌ Wrong — listener leaks on re-render/unmount
useEffect(() => {
  map?.on('load', () => setIsMapReady(true));
}, [map]);

// ✅ Correct
useEffect(() => {
  if (!map) return;
  function onLoad() { setIsMapReady(true); }
  if (map.isStyleLoaded()) onLoad();
  else map.on('load', onLoad);
  return () => map.off('load', onLoad);
}, [map]);
```

Applies to: `components/map/KabupatensList.jsx`.

### Rule 7: GEE layer mutations on shared source/layer ids must be serialized

```js
// ❌ Wrong — year change + breadcrumb click both call loadGEEPolygonRaster
// concurrently on the same gee-lulc source/layer

// ✅ Correct — use a request queue or abort-before-proceed
let geeLoadPromise = null;
async function loadGEEPolygonRaster(map, filters) {
  if (geeLoadPromise) {
    // Either await the current one (dedup) or abort and restart
  }
  geeLoadPromise = doLoadGEE(map, filters);
  try { await geeLoadPromise; } finally { geeLoadPromise = null; }
}
```

Applies to: `store/mapLayerStore.js` `loadGEEPolygonRaster`.

## Conventions

- English code, Indonesian UI strings only
- No abbreviations: `districtRecord` not `k`, `response` not `res`, `featureId` not `fid`
- Comments in English, explain WHY not WHAT
- Section dividers: `// ─── SECTION NAME ───`
- All constants from `constants.js`
- Cleanup event listeners in `useEffect` return
- `catch {}` without variable if error is unused
- Separate `useEffect` by responsibility (init map vs load data)
- No blocking operations on cache-hit path

## Installed Skills (`.agents/skills/`)

Reference guides available in `web/.agents/skills/`. Read the relevant `SKILL.md` before implementing:

| Skill | Triggers | Description |
|-------|----------|-------------|
| `react-best-practices` | react, component, hook, performance, rerender | React performance patterns |
| `composition-patterns` | compound component, render props, slot, children | React composition patterns |
| `tailwind-css-patterns` | tailwind, css, styling, responsive | Tailwind CSS patterns |
| `frontend-design` | design, ui, ux, component design | Frontend design best practices |
| `accessibility` | a11y, aria, screen reader, keyboard, wcag | Accessibility practices |
| `vite` | vite, build, config | Vite configuration |
| `seo` | seo, meta, sitemap | SEO patterns |
| `deploy-to-vercel` | deploy, vercel, preview, production | Vercel deployment guide |
| `nodejs-best-practices` | node.js, best practices | Node.js best practices |
| `nodejs-backend-patterns` | backend, api, middleware | Node.js backend patterns |

## Self-Audit Checklist

Before every edit:
- [ ] All variables: descriptive English, zero abbreviations
- [ ] No `new AbortController()` outside `mapLayerStore.js`
- [ ] Logic already exists in `utils/` or `store/`? Use it.
- [ ] Duplicate logic? Extract to shared helper.
- [ ] `useShallow` for 2+ Zustand fields
- [ ] Event listeners cleaned up in `useEffect` return
- [ ] Layer removal order: hover-line → fill → source
- [ ] Using `waitForSourceData()` not `setTimeout()`
- [ ] Constants from `constants.js`, not hardcoded
