import {
  loadGEEPolygonRaster,
  loadLayer,
  removeLayerAndSource,
  abortActiveRequests,
} from '../store/mapLayerStore.js';
import { zoomToMatchingFeature, waitForSourceData } from './mapUtils.js';
import { useMapStore } from '../store/mapStore.js';
import { LAYER_IDS, LAYER_TYPES, SOURCE_IDS } from '../config/constants.js';
import { buildSingleFilter, buildKecamatanFilter } from './filterBuilder.js';

// All layer IDs for cleanup on reset
const ALL_LAYER_IDS = [LAYER_IDS.DESA_FILL, LAYER_IDS.KECAMATAN_FILL, LAYER_IDS.KABUPATEN_FILL];

// Reset map to initial view (whole Indonesia)
export async function handleHomeReset(
  mapInstance,
  resetBreadcrumbsCallback,
  initialCenterCoordinate,
  initialZoomLevel,
) {
  if (!mapInstance) return;

  // 1. Cancel all in-flight fetch requests (GeoServer + GEE) immediately
  abortActiveRequests();

  // 2. Remove all drilldown layers from map
  ALL_LAYER_IDS.forEach((layerId) => removeLayerAndSource(mapInstance, layerId));

  // 3. Reset Zustand store state (triggers useEffect in Map.jsx → auto-reload kabupaten)
  resetBreadcrumbsCallback();
  useMapStore.getState().setSelectedKab(null);

  // 4. Animate back to initial view
  mapInstance.flyTo({ center: initialCenterCoordinate, zoom: initialZoomLevel });

  // useEffect in Map.jsx will auto-reload kabupaten layer + GEE
  // after breadcrumbs are reset above
}

// Drill to next level according to adminLevel (kabupaten → kecamatan → desa)
export async function handleBreadcrumbDrill(
  mapInstance,
  adminLevel,
  breadcrumbState,
  updateBreadcrumbCallback,
) {
  if (!mapInstance) return;

  // LEVEL 1: User selects kabupaten → show kecamatan within that kabupaten
  if (adminLevel === 'kabupaten' && breadcrumbState.kab) {
    updateBreadcrumbCallback('kecamatan', undefined);
    updateBreadcrumbCallback('desa', undefined);

    removeLayerAndSource(mapInstance, LAYER_IDS.DESA_FILL);
    removeLayerAndSource(mapInstance, LAYER_IDS.KECAMATAN_FILL);

    const kabupatenFilter = buildSingleFilter('kab', breadcrumbState.kab);
    await loadLayer(
      mapInstance,
      LAYER_TYPES.KABUPATEN,
      SOURCE_IDS.ZOOM_KABUPATEN,
      LAYER_IDS.KABUPATEN_FILL,
      kabupatenFilter,
    );
    await waitForSourceData(mapInstance, SOURCE_IDS.ZOOM_KABUPATEN);
    zoomToMatchingFeature(mapInstance, SOURCE_IDS.ZOOM_KABUPATEN, 'kab', breadcrumbState.kab);

    await loadGEEPolygonRaster(mapInstance, { kab: breadcrumbState.kab });
    await loadLayer(
      mapInstance,
      LAYER_TYPES.KECAMATAN,
      SOURCE_IDS.KECAMATAN,
      LAYER_IDS.KECAMATAN_FILL,
      kabupatenFilter,
    );
    removeLayerAndSource(mapInstance, LAYER_IDS.KABUPATEN_FILL);

    return;
  }

  // LEVEL 2: User selects kecamatan → show desa within that kecamatan
  if (adminLevel === 'kecamatan' && breadcrumbState.kab && breadcrumbState.kec) {
    updateBreadcrumbCallback('desa', undefined);
    removeLayerAndSource(mapInstance, LAYER_IDS.DESA_FILL);

    const kecamatanFilter = buildSingleFilter('kec', breadcrumbState.kec);
    await loadLayer(
      mapInstance,
      LAYER_TYPES.KECAMATAN,
      SOURCE_IDS.ZOOM_KECAMATAN,
      LAYER_IDS.KECAMATAN_FILL,
      kecamatanFilter,
    );
    await waitForSourceData(mapInstance, SOURCE_IDS.ZOOM_KECAMATAN);
    zoomToMatchingFeature(mapInstance, SOURCE_IDS.ZOOM_KECAMATAN, 'kec', breadcrumbState.kec);

    await loadGEEPolygonRaster(mapInstance, { kec: breadcrumbState.kec });
    await loadLayer(
      mapInstance,
      LAYER_TYPES.DESA,
      SOURCE_IDS.DESA,
      LAYER_IDS.DESA_FILL,
      kecamatanFilter,
    );
    removeLayerAndSource(mapInstance, LAYER_IDS.KECAMATAN_FILL);

    return;
  }

  // LEVEL 3: User selects desa → zoom to specific desa
  if (adminLevel === 'desa' && breadcrumbState.kab && breadcrumbState.kec && breadcrumbState.des) {
    const desaFilter = buildKecamatanFilter({
      kab: breadcrumbState.kab,
      kec: breadcrumbState.kec,
    });

    await loadLayer(
      mapInstance,
      LAYER_TYPES.DESA,
      SOURCE_IDS.ZOOM_DESA,
      LAYER_IDS.DESA_FILL,
      desaFilter,
    );
    await waitForSourceData(mapInstance, SOURCE_IDS.ZOOM_DESA);
    zoomToMatchingFeature(mapInstance, SOURCE_IDS.ZOOM_DESA, 'des', breadcrumbState.des);

    await loadGEEPolygonRaster(mapInstance, { des: breadcrumbState.des });
    await loadLayer(
      mapInstance,
      LAYER_TYPES.DESA,
      SOURCE_IDS.DESA,
      LAYER_IDS.DESA_FILL,
      desaFilter,
    );
    removeLayerAndSource(mapInstance, LAYER_IDS.DESA_FILL);
  }
}
