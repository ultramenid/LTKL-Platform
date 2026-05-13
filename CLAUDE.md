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
- **Icons**: lucide-react
- **D3 modules**: d3-sankey, d3-shape, d3-interpolate
- **Test runner**: none (no test files in web/)

## Commands

```bash
npm run dev          # vite (port 3000)
npm run build        # vite build
npm run lint         # eslint
npm run format       # prettier --write
npm run format:check # prettier --check
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
│   ├── mapLoadingSetup.js # Map initialization helpers
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
