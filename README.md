# LTKL Web — Public Map Website

Interactive geospatial data platform for Kalimantan Tengah kabupaten governments. Drives map exploration from kabupaten to desa, Google Earth Engine satellite imagery, supply chain analytics, and commodity dashboards.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite)](https://vite.dev)
[![MapLibre](https://img.shields.io/badge/MapLibre%20GL-5-3766CC?style=flat&logo=maplibre)](https://maplibre.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat&logo=nodedotjs)](https://nodejs.org)

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Data Flow](#data-flow)
- [External Services](#external-services)
- [State Management](#state-management)
- [Key Patterns](#key-patterns)
- [Build & Deploy](#build--deploy)
- [Contributing](#contributing)

## About

Public-facing website with interactive MapLibre GL maps for citizen engagement. Users explore land-cover change across kabupaten, kecamatan, and desa boundaries with yearly satellite imagery from Google Earth Engine. Profile pages include coverage statistics, commodity dashboards, supply chain sankey diagrams, population tables, and downloadable reports.

**Drill-down flow:** Indonesia → Kabupaten → Kecamatan → Desa, with breadcrumb navigation and URL-synced state.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + Vite 7 |
| **Maps** | MapLibre GL JS 5 |
| **Charts** | ECharts 6 via `echarts-for-react` |
| **Geo** | Turf.js 7 (`pointOnFeature`, centroid calculations) |
| **State** | Zustand 5 (two stores: `mapStore`, `mapLayerStore`) |
| **Routing** | react-router-dom 7 |
| **Data Fetching** | SWR 2 |
| **Styling** | Tailwind CSS 4 via `@tailwindcss/vite` |
| **Diagrams** | d3-sankey |
| **Icons** | lucide-react |
| **Build** | Vite 7 |
| **Lint** | ESLint 9 + Prettier |

## Project Structure

```
src/
├── App.jsx                    # Root component + routing
├── main.jsx                   # React root mount
├── components/
│   ├── ErrorBoundary.jsx      # Per-area error isolation
│   ├── LeftPanel.jsx          # Sidebar (kabupaten list, breadcrumbs)
│   ├── RightPanel.jsx         # Map container
│   ├── ProfilePage.jsx        # Kabupaten profile page
│   ├── map/                   # Map-specific components
│   │   ├── Map.jsx            # Main map (lifecycle, transitions)
│   │   ├── BreadCrumbs.jsx    # Drill-down breadcrumb trail
│   │   ├── KabupatensList.jsx # Sidebar kabupaten cards + hover markers
│   │   ├── CoverageChart.jsx  # ECharts area coverage bar chart
│   │   ├── TimeSelector.jsx   # Year selector (timeline dots)
│   │   └── MapLegend.jsx      # LULC color legend
│   ├── profile/               # Profile tab components
│   │   ├── MapTab.jsx         # Profile-level drill-down map
│   │   ├── Commodity.jsx      # Commodity dashboard
│   │   ├── SupplyChainTab.jsx # Sankey supply chain diagram
│   │   ├── EconomyTab.jsx     # Economic indicators
│   │   ├── PopulationTab.jsx  # Population statistics
│   │   ├── NewsTab.jsx        # Kabupaten news/articles
│   │   ├── ReportsTab.jsx     # Downloadable reports
│   │   ├── DownloadTab.jsx    # File downloads
│   │   ├── ContactTab.jsx     # Contact information
│   │   ├── ProdukUnggulanTab.jsx
│   │   ├── KabupatenProfileTab.jsx
│   │   ├── ProfileSection.jsx # Shared section wrapper
│   └── ui/                    # Shared UI primitives
├── config/
│   └── constants.js           # All constants (endpoints, colors, layer IDs, cache config)
├── data/
│   ├── build-supplychain-data.mjs # Supply-chain dataset generator
│   └── kabupatens.js          # Static kabupaten reference data
├── hooks/                     # Custom React hooks
├── lib/                       # Utility libraries
├── pages/                     # Route-level page components
├── store/
│   ├── mapLayerStore.js       # Layer management, AbortController, GEE/GeoJSON fetch
│   └── mapStore.js            # Breadcrumbs, year, cache, map instance
└── utils/
    ├── dataTransform.js       # Server response normalization
    ├── filterBuilder.js       # CQL/WFS filter construction
    ├── mapDrilldown.js        # Home reset + breadcrumb drill-down
    ├── mapTransitionController.js  # Centralized main-map transition orchestration
    ├── mapUtils.js            # Zoom, bounds, source-data waiting, feature lookup
    └── urlStateSync.js        # URL ↔ state synchronization
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Installation

```bash
cd web
npm install
```

### Development

```bash
npm run dev        # Vite dev server → http://localhost:3000
npm run lint       # ESLint
npm run format     # Prettier (write)
npm run format:check  # Prettier (check-only)
```

The dev server proxies API calls automatically (see `vite.config.ts`).

## Data Flow

```
URL params → parseUrlState() → mapStore.setState() → useEffect → transitionMainMap()
User click → attachInteractions() → handleGlobalDrillDown() → updateBreadcrumb() → transitionMainMap()
Year change → setYear() → updateUrl() → loadGEEPolygonRaster() with new filter
```

## External Services

| Service | Endpoint | Purpose |
|---|---|---|
| **GeoServer WFS** | `https://aws.simontini.id/geoserver/ows` | Admin boundary GeoJSON (kabupaten, kecamatan, desa) |
| **GEE Tile Server** | `$VITE_TILE_SERVER` | LULC raster tiles + `/lulc-stats` endpoint |

Both are external and pre-configured. Do not modify the endpoint URLs.

## State Management

Two Zustand stores with distinct responsibilities.

### `mapStore.js` — Read & Write State

```js
// Breadcrumbs
useMapStore.getState().updateBreadcrumb('kecamatan', 'Pahandut');
useMapStore.getState().resetBreadcrumbs();

// Year
useMapStore.getState().setYear(2024);

// Map instance (set once on mount)
useMapStore.getState().setMap(mapInstance);

// Selected kabupaten
useMapStore.getState().setSelectedKab('Sintang');
```

### `mapLayerStore.js` — Layer & Fetch Utilities

```js
import { abortActiveRequests, getActiveSignal } from './store/mapLayerStore.js';

abortActiveRequests();                    // Cancel all in-flight fetches
const signal = getActiveSignal();         // New signal for current operation
await fetch(url, { signal });            // Bound to module-level AbortController
```

**Key rules:**

- Never `new AbortController()` in components — use the module-level one
- Zustand subscriptions: use `useShallow` for 2+ fields, individual selector for 1 field
- Layer removal order: hover-line → fill → source

## Key Patterns

### Map Transition Controller

Centralized orchestration in `utils/mapTransitionController.js`:

```js
transitionMainMap({ map, target, setLoading, shouldCommit });
```

- `target`: `{ kabupaten, kecamatan, desa, year }`
- `shouldCommit`: prevents stale transitions from clearing loading state
- Handles abort → clear → load layer → zoom → load GEE → pre-load child layers
- Single entry point for main-map state changes (breadcrumb click, year change, kabupaten list click)

### Cache Strategy

```
In-memory (Zustand) → localStorage → pending request dedup → fetch from API
```

- GeoJSON: cached by layer name + CQL filter
- GEE tiles: cached by filter params, validated with Image() probe (5s timeout)
- TTL: 1.5 hours for GEE tokens

### Abort Safety

```js
// Do
import { abortActiveRequests, getActiveSignal } from './store/mapLayerStore.js';
const signal = getActiveSignal();
await fetchGeeData(map, filters, signal);

// Don't
const controller = new AbortController();  // ← never in components
```

## Build & Deploy

```bash
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
```

## Contributing

1. Follow the conventions in `CLAUDE.md` (English code, Indonesian UI strings, no abbreviations)
2. All constants from `src/config/constants.js` — no magic strings/numbers
3. Map event listeners must be cleaned up in `useEffect` return
4. Use `waitForSourceData()` for event-driven waits (not `setTimeout`)
5. Layer removal order: hover-line → fill → source
6. Run `npm run build` before committing — build must pass

## License

TBD
