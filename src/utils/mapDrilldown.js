import { loadGEEPolygonRaster, loadLayer, removeLayerAndSource, abortActiveRequests } from "../store/mapLayerStore.js";
import { zoomToMatchingFeature, waitForSourceData } from "./mapUtils.js";
import { useMapStore } from "../store/mapStore.js";
import { LAYER_IDS, LAYER_TYPES, SOURCE_IDS } from "../config/constants.js";
import { buildSingleFilter, buildKecamatanFilter } from "./filterBuilder.js";

// Daftar semua layer ID untuk cleanup saat reset
const ALL_LAYER_IDS = [LAYER_IDS.DESA_FILL, LAYER_IDS.KECAMATAN_FILL, LAYER_IDS.KABUPATEN_FILL];

// Reset map ke tampilan awal (Indonesia keseluruhan)
export async function handleHomeReset(
  mapInstance,
  resetBreadcrumbsCallback,
  initialCenterCoordinate,
  initialZoomLevel
) {
  if (!mapInstance) return;

  // 1. Batalkan semua in-flight fetch requests (GeoServer + GEE) segera
  abortActiveRequests();

  // 2. Hapus semua layer drilldown dari map
  ALL_LAYER_IDS.forEach((layerId) => removeLayerAndSource(mapInstance, layerId));

  // 3. Reset state di Zustand store (ini memicu useEffect di Map.jsx → reload kabupaten otomatis)
  resetBreadcrumbsCallback();
  useMapStore.getState().setSelectedKab(null);
  
  // 4. Animate kembali ke tampilan awal
  mapInstance.flyTo({ center: initialCenterCoordinate, zoom: initialZoomLevel });

  // useEffect di Map.jsx akan reload kabupaten layer + GEE otomatis
  // setelah breadcrumbs direset di atas
}

// Drill ke level berikutnya sesuai adminLevel (kabupaten → kecamatan → desa)
export async function handleBreadcrumbDrill(
  mapInstance,
  adminLevel,
  breadcrumbState,
  updateBreadcrumbCallback
) {
  if (!mapInstance) return;

  // LEVEL 1: User pilih kabupaten → tampilkan kecamatan di kabupaten itu
  if (adminLevel === "kabupaten" && breadcrumbState.kab) {
    updateBreadcrumbCallback("kecamatan", undefined);
    updateBreadcrumbCallback("desa", undefined);

    removeLayerAndSource(mapInstance, LAYER_IDS.DESA_FILL);
    removeLayerAndSource(mapInstance, LAYER_IDS.KECAMATAN_FILL);

    const kabupatenFilter = buildSingleFilter('kab', breadcrumbState.kab);
    await loadLayer(mapInstance, LAYER_TYPES.KABUPATEN, SOURCE_IDS.ZOOM_KABUPATEN, LAYER_IDS.KABUPATEN_FILL, kabupatenFilter);
    await waitForSourceData(mapInstance, SOURCE_IDS.ZOOM_KABUPATEN);
    zoomToMatchingFeature(mapInstance, SOURCE_IDS.ZOOM_KABUPATEN, "kab", breadcrumbState.kab);
    
    await loadGEEPolygonRaster(mapInstance, { kab: breadcrumbState.kab });
    await loadLayer(mapInstance, LAYER_TYPES.KECAMATAN, SOURCE_IDS.KECAMATAN, LAYER_IDS.KECAMATAN_FILL, kabupatenFilter);
    removeLayerAndSource(mapInstance, LAYER_IDS.KABUPATEN_FILL);

    return;
  }

  // LEVEL 2: User pilih kecamatan → tampilkan desa di kecamatan itu
  if (adminLevel === "kecamatan" && breadcrumbState.kab && breadcrumbState.kec) {
    updateBreadcrumbCallback("desa", undefined);
    removeLayerAndSource(mapInstance, LAYER_IDS.DESA_FILL);

    const kecamatanFilter = buildSingleFilter('kec', breadcrumbState.kec);
    await loadLayer(mapInstance, LAYER_TYPES.KECAMATAN, SOURCE_IDS.ZOOM_KECAMATAN, LAYER_IDS.KECAMATAN_FILL, kecamatanFilter);
    await waitForSourceData(mapInstance, SOURCE_IDS.ZOOM_KECAMATAN);
    zoomToMatchingFeature(mapInstance, SOURCE_IDS.ZOOM_KECAMATAN, "kec", breadcrumbState.kec);
    
    await loadGEEPolygonRaster(mapInstance, { kec: breadcrumbState.kec });
    await loadLayer(mapInstance, LAYER_TYPES.DESA, SOURCE_IDS.DESA, LAYER_IDS.DESA_FILL, kecamatanFilter);
    removeLayerAndSource(mapInstance, LAYER_IDS.KECAMATAN_FILL);

    return;
  }

  // LEVEL 3: User pilih desa → zoom ke desa spesifik
  if (adminLevel === "desa" && breadcrumbState.kab && breadcrumbState.kec && breadcrumbState.des) {
    const desaFilter = buildKecamatanFilter({ kab: breadcrumbState.kab, kec: breadcrumbState.kec });
    
    await loadLayer(mapInstance, LAYER_TYPES.DESA, SOURCE_IDS.ZOOM_DESA, LAYER_IDS.DESA_FILL, desaFilter);
    await waitForSourceData(mapInstance, SOURCE_IDS.ZOOM_DESA);
    zoomToMatchingFeature(mapInstance, SOURCE_IDS.ZOOM_DESA, "des", breadcrumbState.des);
    
    await loadGEEPolygonRaster(mapInstance, { des: breadcrumbState.des });
    await loadLayer(mapInstance, LAYER_TYPES.DESA, SOURCE_IDS.DESA, LAYER_IDS.DESA_FILL, desaFilter);
    removeLayerAndSource(mapInstance, LAYER_IDS.DESA_FILL);
  }
}
