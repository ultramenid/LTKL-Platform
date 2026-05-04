import maplibregl from 'maplibre-gl';
import { useMapStore } from './mapStore.js';
import { zoomToFeature } from '../utils/mapUtils.js';
import { KABUPATENS } from '../data/kabupatens.js';

// Normalize GeoJSON kab property to canonical name in KABUPATENS list
// Case-insensitive matching, fallback to original value if not found (data may be inconsistent)
const resolveKabName = (rawKab) =>
  KABUPATENS.find(
    (kabupatenRecord) => kabupatenRecord.name.toLowerCase() === String(rawKab).toLowerCase(),
  )?.name ?? rawKab;

import {
  API_ENDPOINTS,
  COLORS,
  LAYER_IDS,
  LAYER_TYPES,
  SOURCE_IDS,
  WFS_CONFIG,
} from '../config/constants.js';
import {
  buildSingleFilter,
  buildKecamatanFilter,
  buildDesaFilter,
} from '../utils/filterBuilder.js';

// Re-export for backward compatibility
export const GEOSERVER_URL = API_ENDPOINTS.GEOSERVER;
export const TILE_SERVER_URL = API_ENDPOINTS.TILE_SERVER;

const LAYERS = {
  GEE_LAYER: LAYER_IDS.GEE_LAYER,
  GEE_SOURCE: SOURCE_IDS.GEE,
  HOVER_SUFFIX: '-hover-line',
};

// ─── ABORT CONTROLLER (module-level) ───
// Used to cancel all in-flight fetch requests when user clicks Home
// Replaced (abort + new) every time abortActiveRequests() is called
let activeController = new AbortController();

// Separate controller for stats/chart fetches so map navigation (abortActiveRequests)
// never cancels in-flight chart data — stats are independent of layer lifecycle
let statsController = new AbortController();

// ─── SHARED HELPERS (extracted from loadLayer & loadLayerWithCallback) ──
// These eliminate duplicated WFS fetch, layer creation, and interaction binding logic.
// Both public functions now delegate to these helpers, differing only in click behavior.

/**
 * Fetch GeoJSON from GeoServer WFS with cache-first strategy and request deduplication.
 * Returns validated GeoJSON object or null on abort/error.
 * Uses activeController signal so abortActiveRequests() can cancel in-flight fetches (Rule A).
 */
async function fetchGeoJSONFromWFS(layerName, sourceId, cqlFilter) {
  const store = useMapStore.getState();
  const cacheKey = `geojson_${layerName}_${cqlFilter || 'all'}`;

  // Return cached data immediately if available
  const cachedGeoJson = store.getCacheGeoJSON(cacheKey);
  if (cachedGeoJson) return cachedGeoJson;

  // Await existing pending request if one is already in-flight (dedup)
  const pendingRequest = store.getPending(cacheKey);
  if (pendingRequest) return await pendingRequest;

  // Build WFS query params
  const wfsParams = new URLSearchParams({
    service: WFS_CONFIG.SERVICE,
    version: WFS_CONFIG.VERSION,
    request: WFS_CONFIG.REQUEST,
    typeNames: layerName,
    outputFormat: WFS_CONFIG.OUTPUT_FORMAT,
  });
  if (cqlFilter) wfsParams.append('CQL_FILTER', cqlFilter);

  const geoserverUrl = `${GEOSERVER_URL}?${wfsParams.toString()}`;

  // Create and track the fetch promise for deduplication
  const fetchPromise = (async () => {
    const response = await fetch(geoserverUrl, { signal: activeController.signal });
    return await response.json();
  })();

  store.setPending(cacheKey, fetchPromise);
  let geoJsonData;
  try {
    geoJsonData = await fetchPromise;
  } finally {
    store.clearPending(cacheKey);
  }

  // Validate and cache the result
  if (geoJsonData?.features) {
    store.setCacheGeoJSON(cacheKey, geoJsonData);
  }
  return geoJsonData;
}

/**
 * Ensure MapLibre source and layers exist for a given GeoJSON dataset.
 *
 * Strategy:
 * - If source already exists: update its data, recreate missing layers
 * - If source doesn't exist: remove stale layers/sources, create from scratch
 *
 * Always creates a fill layer (transparent with conditional highlight) and a hover line layer
 * that sits on top for thick hover outlines.
 */
function renderAndSetupLayers(map, geoJsonData, sourceId, layerId) {
  const hoverLineId = `${layerId}${LAYERS.HOVER_SUFFIX}`;

  // Ensure every feature has an id — required for MapLibre feature-state (hover highlighting)
  geoJsonData.features.forEach((feature, index) => {
    if (feature.id === undefined) feature.id = index;
  });

  if (map.getSource(sourceId)) {
    // Source exists — just update data
    map.getSource(sourceId).setData(geoJsonData);

    // Recreate fill layer if it was removed but source remains
    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': 'transparent',
          'fill-opacity': 0.5,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            COLORS.HIGHLIGHT,
            COLORS.DEFAULT,
          ],
        },
      });
    }

    // Ensure hover line layer exists
    if (!map.getLayer(hoverLineId)) {
      map.addLayer({
        id: hoverLineId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            COLORS.HIGHLIGHT,
            COLORS.TRANSPARENT,
          ],
          'line-width': 2,
          'line-opacity': 0.98,
        },
      });
    } else {
      // Update hover line properties in case they changed
      const hoverLine = map.getLayer(hoverLineId);
      if (hoverLine) {
        map.setPaintProperty(hoverLineId, 'line-width', 2);
        map.setPaintProperty(hoverLineId, 'line-opacity', 0.98);
        map.setPaintProperty(hoverLineId, 'line-color', [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          COLORS.HIGHLIGHT,
          COLORS.TRANSPARENT,
        ]);
      }
    }
  } else {
    // Source doesn't exist — remove stale layers then create from scratch
    try {
      if (map.getLayer(`${layerId}${LAYERS.HOVER_SUFFIX}`))
        map.removeLayer(`${layerId}${LAYERS.HOVER_SUFFIX}`);
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    } catch {
      /* skip */
    }

    map.addSource(sourceId, { type: 'geojson', data: geoJsonData, generateId: true });

    // Create fill layer
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': 'transparent',
        'fill-opacity': 0.5,
        'fill-outline-color': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          COLORS.HIGHLIGHT,
          COLORS.DEFAULT,
        ],
      },
    });

    // Create hover line layer (above fill layer for thick highlight on hover)
    map.addLayer({
      id: hoverLineId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          COLORS.HIGHLIGHT,
          COLORS.TRANSPARENT,
        ],
        'line-width': 2,
        'line-opacity': 0.98,
      },
    });
  }

  bringHoverLayersToTop(map);
}

/**
 * Attach hover (cursor, popup, highlight) + click interactions to a layer.
 * Mouseenter/mouseleave/mousemove are shared across all callers.
 * Click behavior is delegated to onClickHandler so caller controls navigation.
 *
 * @param {maplibregl.Map} map       - MapLibre map instance
 * @param {string}         layerId   - Fill layer ID (e.g. 'kabupaten-fill')
 * @param {Function}       onClickHandler - Called with clicked event; decides next action
 * @returns {Function} cleanup       - Remove all event listeners and popup
 */
function attachInteractions(map, layerId, onClickHandler) {
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
  const sourceId = layerId.replace('-fill', '-src');
  let lastHoverFeatureId = null;

  const clearHoverState = () => {
    if (lastHoverFeatureId !== null && map.getSource(sourceId)) {
      map.setFeatureState({ source: sourceId, id: lastHoverFeatureId }, { hover: false });
      lastHoverFeatureId = null;
    }
  };

  const onMouseEnter = () => {
    map.getCanvas().style.cursor = 'pointer';
  };

  const onMouseLeave = () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
    clearHoverState();
  };

  const onMouseMove = (e) => {
    const hoveredFeature = e.features?.[0];
    if (!hoveredFeature || !map.getSource(sourceId)) return;

    const hoveredFeatureId = hoveredFeature.id;
    if (lastHoverFeatureId !== null && lastHoverFeatureId !== hoveredFeatureId) clearHoverState();
    if (hoveredFeatureId !== undefined && map.getSource(sourceId)) {
      map.setFeatureState({ source: sourceId, id: hoveredFeatureId }, { hover: true });
      lastHoverFeatureId = hoveredFeatureId;
    }

    // Show area name in popup (priority: desa > kecamatan > kabupaten)
    const areaName =
      hoveredFeature.properties?.des ??
      hoveredFeature.properties?.kec ??
      hoveredFeature.properties?.kab ??
      'Unknown';
    if (areaName && areaName !== 'Unknown') {
      popup.setLngLat(e.lngLat).setHTML(`<strong>${areaName}</strong>`).addTo(map);
    }
  };

  // Bind mouse events once per mount
  map.on('mouseenter', layerId, onMouseEnter);
  map.on('mouseleave', layerId, onMouseLeave);
  map.on('mousemove', layerId, onMouseMove);

  // Delegate click to handler — caller decides drill-down vs local state
  map.on('click', layerId, async (e) => {
    const clickedFeature = e.features?.[0];
    if (!clickedFeature?.properties) return;
    onClickHandler(e);
  });

  // Return cleanup function for caller to invoke before recreation
  return () => {
    try {
      map.off('mouseenter', layerId, onMouseEnter);
      map.off('mouseleave', layerId, onMouseLeave);
      map.off('mousemove', layerId, onMouseMove);
      map.off('click', layerId);
    } catch {
      /* map may have been removed during unmount */
    }
    popup.remove();
  };
}

// Cancel all in-flight requests (GeoServer + GEE tile server)
// Also clear pending request dedup so new requests can start fresh
export function abortActiveRequests() {
  activeController.abort();
  activeController = new AbortController();
  // Clear all pending request references so we don't await already-aborted promises
  useMapStore.getState().clearAllPending();
}

// Return the current activeController's signal for map layer fetches
export function getActiveSignal() {
  return activeController.signal;
}

// Cancel any in-flight stats/chart fetch (called before each new stats fetch)
// Kept separate from activeController so map navigation doesn't abort chart data
export function abortStatsRequests() {
  statsController.abort();
  statsController = new AbortController();
}

// Return the current stats signal for CoverageChart and similar data fetches
export function getStatsSignal() {
  return statsController.signal;
}

// Load GEE LULC raster — cache-first + image probe validation, dedup pending requests
export async function loadGEEPolygonRaster(map, filters = {}) {
  try {
    const { year } = useMapStore.getState();

    const queryParams = new URLSearchParams({
      ...filters,
      year: String(year),
    }).toString();

    const cacheKey = `gee_${queryParams}`;
    const store = useMapStore.getState();

    // ─── CHECK CACHE FIRST ───
    const cachedTileUrl = store.getCacheGEE(cacheKey);
    if (cachedTileUrl) {
      // Validate URL via Image probe — GEE token can expire even if TTL hasn't
      // Using Image() (not fetch HEAD) because GEE blocks CORS for XHR
      const testTileUrl = cachedTileUrl
        .replace('{z}', '4')
        .replace('{x}', '12')
        .replace('{y}', '7');
      const signal = activeController.signal;

      // Abort-aware image probe: resolve true/false, reject only on abort
      const cachedUrlIsValid = await new Promise((resolve, reject) => {
        if (signal.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }

        const imageProbe = new Image();
        const onAbort = () => {
          imageProbe.src = '';
          reject(new DOMException('Aborted', 'AbortError'));
        };
        signal.addEventListener('abort', onAbort, { once: true });

        imageProbe.onload = () => {
          signal.removeEventListener('abort', onAbort);
          resolve(true);
        };
        imageProbe.onerror = () => {
          signal.removeEventListener('abort', onAbort);
          resolve(false);
        };
        imageProbe.src = testTileUrl;
      });

      if (cachedUrlIsValid) {
        if (map.getLayer(LAYERS.GEE_LAYER)) map.removeLayer(LAYERS.GEE_LAYER);
        if (map.getSource(LAYERS.GEE_SOURCE)) map.removeSource(LAYERS.GEE_SOURCE);
        map.addSource(LAYERS.GEE_SOURCE, {
          type: 'raster',
          tiles: [cachedTileUrl],
          tileSize: 256,
        });

        const allLayers = map.getStyle()?.layers ?? [];
        const layerIdToPlaceBelow =
          allLayers.find((layer) =>
            [LAYER_IDS.KABUPATEN_FILL, LAYER_IDS.KECAMATAN_FILL, LAYER_IDS.DESA_FILL].includes(
              layer.id,
            ),
          )?.id || undefined;

        map.addLayer(
          {
            id: LAYERS.GEE_LAYER,
            type: 'raster',
            source: LAYERS.GEE_SOURCE,
            paint: { 'raster-opacity': 1 },
          },
          layerIdToPlaceBelow,
        );

        // Ensure hover line layers are on top (visible)
        bringHoverLayersToTop(map);
        return;
      }

      // GEE token expired — remove old cache, re-fetch
      store.clearCacheGEE(cacheKey);
    }

    // ─── CHECK PENDING REQUEST (avoid duplicate requests) ───
    const pendingRequest = store.getPending(cacheKey);
    if (pendingRequest) {
      // Request already in-flight by another caller, just wait for it
      await pendingRequest;
      return;
    }

    // ─── FETCH DATA FROM TILE SERVER ───
    const tileServerUrl = TILE_SERVER_URL + `${queryParams ? `/lulc?${queryParams}` : '/lulc'}`;

    const fetchPromise = (async () => {
      const response = await fetch(tileServerUrl, {
        signal: activeController.signal,
      });
      const geeRasterTileUrl = await response.text();

      if (!geeRasterTileUrl || geeRasterTileUrl.trim() === '') {
        return;
      }

      store.setCacheGEE(cacheKey, geeRasterTileUrl);

      if (map.getLayer(LAYERS.GEE_LAYER)) map.removeLayer(LAYERS.GEE_LAYER);
      if (map.getSource(LAYERS.GEE_SOURCE)) map.removeSource(LAYERS.GEE_SOURCE);

      map.addSource(LAYERS.GEE_SOURCE, {
        type: 'raster',
        tiles: [geeRasterTileUrl],
        tileSize: 256,
      });

      // Place GEE raster below administrative boundaries
      const allLayers = map.getStyle()?.layers ?? [];
      const layerIdToPlaceBelow =
        allLayers.find((layer) =>
          [LAYER_IDS.KABUPATEN_FILL, LAYER_IDS.KECAMATAN_FILL, LAYER_IDS.DESA_FILL].includes(
            layer.id,
          ),
        )?.id || undefined;

      map.addLayer(
        {
          id: LAYERS.GEE_LAYER,
          type: 'raster',
          source: LAYERS.GEE_SOURCE,
          paint: {
            'raster-opacity': 1,
          },
        },
        layerIdToPlaceBelow,
      );

      // Ensure hover line layers are on top
      bringHoverLayersToTop(map);
    })();

    store.setPending(cacheKey, fetchPromise);
    await fetchPromise;
    store.clearPending(cacheKey);
  } catch (err) {
    if (err.name === 'AbortError') return; // Cancelled on Home click, not an error
    console.error('Failed to load GEE LULC raster:', err);
  }
}

// Remove all layers using a source, then remove the source
// Look up sourceId from map style (not string derivation) so zoom layers are also covered
export function removeLayerAndSource(map, layerId) {
  if (!map || !map.getStyle) return;

  const allLayers = map.getStyle()?.layers ?? [];

  // Find the actual source used by this layer
  const layerDef = allLayers.find((layerItem) => layerItem.id === layerId);
  let sourceId = layerDef?.source;

  // If layer not found, try deriving from hover-line (fill may have been removed already)
  if (!sourceId) {
    const hoverLineId = `${layerId}${LAYERS.HOVER_SUFFIX}`;
    const hoverLineDef = allLayers.find((layerItem) => layerItem.id === hoverLineId);
    sourceId = hoverLineDef?.source;
  }

  // Last resort: use pattern derivation as fallback
  if (!sourceId) {
    sourceId = layerId.replace('-fill', '-src').replace(LAYERS.HOVER_SUFFIX, '-src');
  }

  // Remove ALL layers using this source (fill + hover-line + other layers)
  allLayers
    .filter((layerItem) => layerItem.source === sourceId)
    .forEach((layerItem) => {
      try {
        if (map.getLayer(layerItem.id)) map.removeLayer(layerItem.id);
      } catch {
        /* skip */
      }
    });

  // After all layers removed, remove the source
  try {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch {
    /* skip */
  }
}

// Move all hover line layers to top so they render above admin boundaries
function bringHoverLayersToTop(map) {
  const allLayers = map.getStyle()?.layers ?? [];
  const hoverLineIds = allLayers
    .map((layer) => layer.id)
    .filter((id) => id.includes(LAYERS.HOVER_SUFFIX));

  // Move each hover line to top (rendering order: undefined = top)
  hoverLineIds.forEach((layerItemId) => {
    try {
      map.moveLayer(layerItemId, undefined);
    } catch {
      // Layer may have been removed already, skip
    }
  });
}

// Load GeoJSON layer from GeoServer (cache-first, dedup pending requests).
// Click triggers global drill-down via updateBreadcrumb (main map behavior).
export const loadLayer = async (
  map,
  layerName,
  sourceId,
  layerId,
  cqlFilter,
  removeLayerIds = [],
) => {
  // Clean up old layers before loading
  removeLayerIds.forEach((id) => removeLayerAndSource(map, id));

  // Fetch GeoJSON with shared cache-first + dedup logic
  const geoJsonData = await fetchGeoJSONFromWFS(layerName, sourceId, cqlFilter);
  if (!geoJsonData?.features) {
    console.warn(`No GeoJSON features loaded for ${layerId}`);
    return;
  }

  // Render fill + hover line layers using shared logic
  renderAndSetupLayers(map, geoJsonData, sourceId, layerId);

  // Attach interactions with drill-down behavior (delegates to updateBreadcrumb)
  attachInteractions(map, layerId, (e) => {
    handleGlobalDrillDown(e, map);
  });

  return geoJsonData;
};

// Global drill-down logic — called when user clicks a feature on the main map.
// Updates breadcrumbs, loads child layers, and manages layer removal chain.
async function handleGlobalDrillDown(event, map) {
  const { updateBreadcrumb } = useMapStore.getState();
  const clickedFeature = event.features?.[0];
  if (!clickedFeature?.properties) return;

  const { kab, kec, des } = clickedFeature.properties;

  // === DESA LEVEL (deepest) ===
  if (des) {
    updateBreadcrumb('kabupaten', kab);
    updateBreadcrumb('kecamatan', kec);
    updateBreadcrumb('desa', des);
    useMapStore.getState().setSelectedKab(resolveKabName(kab));
    zoomToFeature(map, clickedFeature);
    await loadGEEPolygonRaster(map, { des });
    [LAYER_IDS.KECAMATAN_FILL, LAYER_IDS.KABUPATEN_FILL].forEach((id) =>
      removeLayerAndSource(map, id),
    );
    removeLayerAndSource(map, LAYER_IDS.DESA_FILL);
    await loadLayer(
      map,
      LAYER_TYPES.DESA,
      SOURCE_IDS.DESA,
      LAYER_IDS.DESA_FILL,
      buildDesaFilter({ kab, kec, des }),
    );
    return;
  }

  // === KECAMATAN LEVEL (mid-level) ===
  if (kec) {
    updateBreadcrumb('kabupaten', kab);
    updateBreadcrumb('kecamatan', kec);
    updateBreadcrumb('desa', undefined);
    useMapStore.getState().setSelectedKab(resolveKabName(kab));
    zoomToFeature(map, clickedFeature);
    await loadGEEPolygonRaster(map, { kec });
    removeLayerAndSource(map, LAYER_IDS.KABUPATEN_FILL);
    await loadLayer(
      map,
      LAYER_TYPES.DESA,
      SOURCE_IDS.DESA,
      LAYER_IDS.DESA_FILL,
      buildKecamatanFilter({ kab, kec }),
      [LAYER_IDS.KECAMATAN_FILL],
    );
    return;
  }

  // === KABUPATEN LEVEL (top-level) ===
  if (kab) {
    updateBreadcrumb('kabupaten', kab);
    updateBreadcrumb('kecamatan', undefined);
    updateBreadcrumb('desa', undefined);
    useMapStore.getState().setSelectedKab(resolveKabName(kab));
    zoomToFeature(map, clickedFeature);
    await loadGEEPolygonRaster(map, { kab });
    await loadLayer(
      map,
      LAYER_TYPES.KECAMATAN,
      SOURCE_IDS.KECAMATAN,
      LAYER_IDS.KECAMATAN_FILL,
      buildSingleFilter('kab', kab),
      [LAYER_IDS.KABUPATEN_FILL],
    );
  }
}

// Load GeoJSON layer from GeoServer with custom onClick callback.
// Unlike loadLayer(), click behavior stays local to the component (does not leak
// to the global Zustand breadcrumb store). Returns { geojson, cleanup } for
// profile maps that recreate layers when drill level changes.
export const loadLayerWithCallback = async (
  map,
  layerName,
  sourceId,
  layerId,
  cqlFilter,
  onClickCallback,
) => {
  // Fetch GeoJSON using shared cache-first + dedup logic
  const geoJsonData = await fetchGeoJSONFromWFS(layerName, sourceId, cqlFilter);
  if (!geoJsonData?.features) return { geojson: null, cleanup: null };

  // Render fill + hover line layers using shared logic
  renderAndSetupLayers(map, geoJsonData, sourceId, layerId);

  // Attach interactions with local-state click handler (delegates to callback)
  const cleanup = attachInteractions(map, layerId, (e) => {
    const clickedFeature = e.features?.[0];
    if (clickedFeature?.properties) onClickCallback(clickedFeature);
  });

  return { geojson: geoJsonData, cleanup };
};
