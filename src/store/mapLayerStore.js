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

// Cancel all in-flight requests (GeoServer + GEE tile server)
// Also clear pending request dedup so new requests can start fresh
export function abortActiveRequests() {
  activeController.abort();
  activeController = new AbortController();
  // Clear all pending request references so we don't await already-aborted promises
  useMapStore.getState().clearAllPending();
}

// Return the current activeController's signal for other components to use
export function getActiveSignal() {
  return activeController.signal;
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

// Load GeoJSON layer from GeoServer (cache-first, dedup pending requests)
// removeLayerIds: layers to remove before loading
export const loadLayer = async (
  map,
  layerName,
  sourceId,
  layerId,
  cqlFilter,
  removeLayerIds = [],
) => {
  // ─── CLEAN UP OLD LAYER ───
  // removeLayerAndSource handles hover-line + fill layer simultaneously
  removeLayerIds.forEach((id) => removeLayerAndSource(map, id));

  // ─── CHECK CACHE ───
  const cacheKey = `geojson_${layerName}_${cqlFilter || 'all'}`;
  const store = useMapStore.getState();

  let geoJsonData;

  try {
    const cachedGeoJson = store.getCacheGeoJSON(cacheKey);
    if (cachedGeoJson) {
      geoJsonData = cachedGeoJson;
    } else {
      // Dedup: wait for same pending request if one exists
      const pendingRequest = store.getPending(cacheKey);
      if (pendingRequest) {
        geoJsonData = await pendingRequest;
      } else {
        // ─── FETCH FROM GEOSERVER ───
        const wfsParams = new URLSearchParams({
          service: WFS_CONFIG.SERVICE,
          version: WFS_CONFIG.VERSION,
          request: WFS_CONFIG.REQUEST,
          typeNames: layerName,
          outputFormat: WFS_CONFIG.OUTPUT_FORMAT,
        });
        if (cqlFilter) wfsParams.append('CQL_FILTER', cqlFilter);

        const geoserverUrl = `${GEOSERVER_URL}?${wfsParams.toString()}`;

        const fetchPromise = (async () => {
          const response = await fetch(geoserverUrl, {
            signal: activeController.signal,
          });
          return await response.json();
        })();

        store.setPending(cacheKey, fetchPromise);
        geoJsonData = await fetchPromise;
        store.clearPending(cacheKey);
        store.setCacheGeoJSON(cacheKey, geoJsonData);
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return; // Cancelled on Home click, not an error
    console.error(`Failed to load layer ${layerId}:`, err);
    return;
  }

  // Guard: if geoJsonData is empty/null, exit
  if (!geoJsonData || !Array.isArray(geoJsonData.features)) {
    console.warn(`No GeoJSON features loaded for ${layerId}`);
    return;
  }

  // ─── ENSURE FEATURE IDS ───
  // Every feature must have an id for feature-state (hover highlighting) to work consistently
  geoJsonData.features.forEach((feature, index) => {
    if (feature.id === undefined) feature.id = index;
  });

  // ─── ADD/UPDATE SOURCE & LAYER ───
  if (map.getSource(sourceId)) {
    // Source already exists: just update data
    map.getSource(sourceId).setData(geoJsonData);

    // If fill layer was removed but source still exists, recreate the layer
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

    // Ensure hover line layer exists (create or update)
    const hoverLineId = `${layerId}${LAYERS.HOVER_SUFFIX}`;
    if (!map.getLayer(hoverLineId)) {
      map.addLayer({
        id: hoverLineId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
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
      // Update hover line properties
      const existingHoverLine = map.getLayer(hoverLineId);
      if (existingHoverLine) {
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
    // Source doesn't exist: create source + layers from scratch
    // Remove old layers first if they still exist (can happen when source is removed but layers aren't)
    if (map.getLayer(`${layerId}${LAYERS.HOVER_SUFFIX}`))
      map.removeLayer(`${layerId}${LAYERS.HOVER_SUFFIX}`);
    if (map.getLayer(layerId)) map.removeLayer(layerId);

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
    const hoverLineId = `${layerId}${LAYERS.HOVER_SUFFIX}`;
    if (!map.getLayer(hoverLineId)) {
      map.addLayer({
        id: hoverLineId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
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
  }

  // ─── ATTACH INTERACTIONS ───
  // Attach hover + click interactions (prevent duplicates if called >1 time)
  attachLayerInteraction(map, layerId);

  // Ensure hover lines are on top (visible)
  bringHoverLayersToTop(map);

  return geoJsonData;
};

// Attach hover & click interactions to a layer (highlight, popup name, drilldown)
function attachLayerInteraction(map, layerId) {
  const { updateBreadcrumb } = useMapStore.getState();
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

  // Prevent binding handlers twice to the same layer
  const internalMap = map;
  if (!internalMap._attachedLayers) internalMap._attachedLayers = new Set();
  if (internalMap._attachedLayers.has(layerId)) return;
  internalMap._attachedLayers.add(layerId);

  // Derive source ID from layer ID (pattern: 'kabupaten-fill' → 'kabupaten-src')
  const sourceId = layerId.replace('-fill', '-src');
  let lastHoverFeatureId = null; // Track currently hovered feature

  // ─── MOUSE ENTER: Change cursor to pointer ───
  map.on('mouseenter', layerId, () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  // ─── MOUSE LEAVE: Reset cursor & hide popup ───
  map.on('mouseleave', layerId, () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
    // Clear hover state from previous feature
    if (lastHoverFeatureId !== null && map.getSource(sourceId)) {
      map.setFeatureState({ source: sourceId, id: lastHoverFeatureId }, { hover: false });
      lastHoverFeatureId = null;
    }
  });

  // ─── MOUSE MOVE: Show popup & highlight feature ───
  map.on('mousemove', layerId, (e) => {
    const hoveredFeature = e.features?.[0];
    if (!hoveredFeature || !map.getSource(sourceId)) return;

    const hoveredFeatureId = hoveredFeature.id;

    // Clear hover state from previous feature
    if (lastHoverFeatureId !== null && lastHoverFeatureId !== hoveredFeatureId) {
      if (map.getSource(sourceId)) {
        map.setFeatureState({ source: sourceId, id: lastHoverFeatureId }, { hover: false });
      }
      lastHoverFeatureId = null;
    }

    // Set hover state on new feature
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
  });

  // ─── CLICK HANDLER: Drill-down to next level ───
  map.on('click', layerId, async (e) => {
    const clickedFeature = e.features?.[0];
    if (!clickedFeature?.properties) return;

    const { kab, kec, des } = clickedFeature.properties;

    // === DESA LEVEL (deepest) ===
    if (des) {
      updateBreadcrumb('kabupaten', kab);
      updateBreadcrumb('kecamatan', kec);
      updateBreadcrumb('desa', des);
      useMapStore.getState().setSelectedKab(resolveKabName(kab));

      // Zoom to selected desa boundary
      zoomToFeature(map, clickedFeature);

      // Load GEE coverage for this desa
      await loadGEEPolygonRaster(map, { des });

      // Remove parent boundaries (kecamatan & kabupaten no longer needed)
      [LAYER_IDS.KECAMATAN_FILL, LAYER_IDS.KABUPATEN_FILL].forEach((id) =>
        removeLayerAndSource(map, id),
      );

      // Remove old desa layer and reload with 3-level filter
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
      updateBreadcrumb('desa', undefined); // Reset desa when navigating to new kecamatan
      useMapStore.getState().setSelectedKab(resolveKabName(kab));

      // Zoom to selected kecamatan boundary
      zoomToFeature(map, clickedFeature);

      // Load GEE coverage for this kecamatan
      await loadGEEPolygonRaster(map, { kec });

      // Remove kabupaten layer (not needed when drilled to kecamatan)
      removeLayerAndSource(map, LAYER_IDS.KABUPATEN_FILL);

      // Load desa boundaries within this kecamatan
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

      // Zoom to selected kabupaten boundary
      zoomToFeature(map, clickedFeature);

      // Load GEE coverage for this kabupaten
      await loadGEEPolygonRaster(map, { kab });

      // Load kecamatan boundaries within this kabupaten (replace kabupaten layer)
      await loadLayer(
        map,
        LAYER_TYPES.KECAMATAN,
        SOURCE_IDS.KECAMATAN,
        LAYER_IDS.KECAMATAN_FILL,
        buildSingleFilter('kab', kab),
        [LAYER_IDS.KABUPATEN_FILL],
      );
    }
  });
}

// ─── LOAD LAYER WITH CUSTOM CALLBACK (for isolated maps) ───────────────
// Same as loadLayer regarding WFS fetch, GeoJSON cache, and hover/popup interactions.
// The only difference: click calls onClickCallback(feature) so state stays local
// to the component, not leaking to the global Zustand store.
// Returns { geojson, cleanup } because profile map recreates layers
// when drill level changes, and cleanup() prevents event listener buildup.
export const loadLayerWithCallback = async (
  map,
  layerName,
  sourceId,
  layerId,
  cqlFilter,
  onClickCallback,
) => {
  // ─── WFS FETCH + CACHE ───────────────────────────────────────────────────────
  // cacheKey is identical to loadLayer so both maps share the same cache
  const cacheKey = `geojson_${layerName}_${cqlFilter || 'all'}`;
  const store = useMapStore.getState();
  let geoJsonData;

  try {
    const cachedGeoJson = store.getCacheGeoJSON(cacheKey);
    if (cachedGeoJson) {
      geoJsonData = cachedGeoJson;
    } else {
      const pendingRequest = store.getPending(cacheKey);
      if (pendingRequest) {
        geoJsonData = await pendingRequest;
      } else {
        const wfsParams = new URLSearchParams({
          service: WFS_CONFIG.SERVICE,
          version: WFS_CONFIG.VERSION,
          request: WFS_CONFIG.REQUEST,
          typeNames: layerName,
          outputFormat: WFS_CONFIG.OUTPUT_FORMAT,
        });
        if (cqlFilter) wfsParams.append('CQL_FILTER', cqlFilter);

        // Uses activeController so abortActiveRequests() can cancel this fetch (Rule A)
        const fetchPromise = (async () => {
          const wfsResponse = await fetch(`${GEOSERVER_URL}?${wfsParams}`, {
            signal: activeController.signal,
          });
          return await wfsResponse.json();
        })();

        store.setPending(cacheKey, fetchPromise);
        geoJsonData = await fetchPromise;
        store.clearPending(cacheKey);
        store.setCacheGeoJSON(cacheKey, geoJsonData);
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return { geojson: null, cleanup: null };
    console.error(`loadLayerWithCallback: failed to load ${layerId}:`, err);
    return { geojson: null, cleanup: null };
  }

  if (!geoJsonData?.features?.length) return { geojson: null, cleanup: null };
  geoJsonData.features.forEach((feature, index) => {
    if (feature.id === undefined) feature.id = index;
  });

  // ─── ADD SOURCE + LAYER ──────────────────────────────────────────────────────
  const hoverLineId = `${layerId}${LAYERS.HOVER_SUFFIX}`;
  // Remove old layers before adding new ones (order: layers first, then source)
  [hoverLineId, layerId].forEach((layerIdToRemove) => {
    try {
      if (map.getLayer(layerIdToRemove)) map.removeLayer(layerIdToRemove);
    } catch {
      /* skip */
    }
  });
  try {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch {
    /* skip */
  }

  map.addSource(sourceId, { type: 'geojson', data: geoJsonData, generateId: true });
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
  bringHoverLayersToTop(map);

  // ─── HOVER + CLICK INTERACTIONS ─────────────────────────────────────────────────
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
  let lastHoveredFeatureId = null;

  const clearHoverState = () => {
    if (lastHoveredFeatureId !== null) {
      try {
        map.setFeatureState({ source: sourceId, id: lastHoveredFeatureId }, { hover: false });
      } catch {
        /* skip */
      }
      lastHoveredFeatureId = null;
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
    if (lastHoveredFeatureId !== null && lastHoveredFeatureId !== hoveredFeatureId)
      clearHoverState();
    if (hoveredFeatureId !== undefined) {
      try {
        map.setFeatureState({ source: sourceId, id: hoveredFeatureId }, { hover: true });
      } catch {
        /* skip */
      }
      lastHoveredFeatureId = hoveredFeatureId;
    }
    const areaName =
      hoveredFeature.properties?.des ??
      hoveredFeature.properties?.kec ??
      hoveredFeature.properties?.kab ??
      'Unknown';
    if (areaName !== 'Unknown')
      popup.setLngLat(e.lngLat).setHTML(`<strong>${areaName}</strong>`).addTo(map);
  };

  const onClickHandler = (e) => {
    const clickedFeature = e.features?.[0];
    // Delegate to local state — does not touch global store
    if (clickedFeature?.properties) onClickCallback(clickedFeature);
  };

  map.on('mouseenter', layerId, onMouseEnter);
  map.on('mouseleave', layerId, onMouseLeave);
  map.on('mousemove', layerId, onMouseMove);
  map.on('click', layerId, onClickHandler);

  // cleanup is called by caller before recreating layers to prevent listener buildup
  const cleanup = () => {
    try {
      map.off('mouseenter', layerId, onMouseEnter);
      map.off('mouseleave', layerId, onMouseLeave);
      map.off('mousemove', layerId, onMouseMove);
      map.off('click', layerId, onClickHandler);
    } catch {
      /* map may have been removed during component unmount */
    }
    popup.remove();
    clearHoverState();
  };

  return { geojson: geoJsonData, cleanup };
};
