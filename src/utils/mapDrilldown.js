import {
  removeGEERasterLayer,
  removeLayerAndSource,
  abortActiveRequests,
} from '../store/mapLayerStore.js';
import { useMapStore } from '../store/mapStore.js';
import { LAYER_IDS } from '../config/constants.js';

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
  removeGEERasterLayer(mapInstance);

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

  abortActiveRequests();

  if (adminLevel === 'kabupaten' && breadcrumbState.kab) {
    updateBreadcrumbCallback('kecamatan', undefined);
    updateBreadcrumbCallback('desa', undefined);
    return;
  }

  if (adminLevel === 'kecamatan' && breadcrumbState.kab && breadcrumbState.kec) {
    updateBreadcrumbCallback('desa', undefined);
  }
}
