import { loadGEEPolygonRaster, loadLayer, removeLayerAndSource, abortActiveRequests } from "../store/mapLayerStore.js";
import { zoomToMatchingFeature, waitForSourceData } from "./mapUtils.js";
import { useMapStore } from "../store/mapStore.js";
import { LAYER_IDS, LAYER_TYPES, SOURCE_IDS } from "../config/constants.js";

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

// Navigate antar level administratif (Indonesia → kabupaten → kecamatan → desa)
// Setiap level akan di-filter berdasarkan breadcrumb dan di-zoom ke area yang dipilih
// Contoh flow: klik "Bantul" (kabupaten) → tampilkan kecamatan, zoom ke Bantul
export async function handleBreadcrumbDrill(
  mapInstance,
  adminLevel,
  breadcrumbState,
  updateBreadcrumbCallback
) {
  if (!mapInstance) return;

  // LEVEL 1: User pilih kabupaten → tampilkan kecamatan di kabupaten itu
  if (adminLevel === "kabupaten" && breadcrumbState.kab) {
    // Reset desa & kecamatan dari breadcrumb (karena user ganti kabupaten)
    updateBreadcrumbCallback("kecamatan", undefined);
    updateBreadcrumbCallback("desa", undefined);

    // Hapus layer-layer level lebih dalam
    [LAYER_IDS.DESA_FILL, LAYER_IDS.KECAMATAN_FILL].forEach(id => removeLayerAndSource(mapInstance, id));

    // Filter CQL: hanya kecamatan yang ada di kabupaten ini
    const kabupatenFilter = `kab='${breadcrumbState.kab}'`;
    await loadLayer(mapInstance, LAYER_TYPES.KABUPATEN, SOURCE_IDS.ZOOM_KABUPATEN, LAYER_IDS.KABUPATEN_FILL, kabupatenFilter);
    await waitForSourceData(mapInstance, SOURCE_IDS.ZOOM_KABUPATEN);
    zoomToMatchingFeature(mapInstance, SOURCE_IDS.ZOOM_KABUPATEN, "kab", breadcrumbState.kab);
    
    // Load GEE coverage (hanya untuk kabupaten dipilih) dan layer kecamatan
    await loadGEEPolygonRaster(mapInstance, { kab: breadcrumbState.kab });
    await loadLayer(mapInstance, LAYER_TYPES.KECAMATAN, SOURCE_IDS.KECAMATAN, LAYER_IDS.KECAMATAN_FILL, `kab='${breadcrumbState.kab}'`);
    removeLayerAndSource(mapInstance, LAYER_IDS.KABUPATEN_FILL);

    return;
  }

  // LEVEL 2: User pilih kecamatan → tampilkan desa di kecamatan itu
  if (adminLevel === "kecamatan" && breadcrumbState.kab && breadcrumbState.kec) {
    // Reset desa dari breadcrumb
    updateBreadcrumbCallback("desa", undefined);
    removeLayerAndSource(mapInstance, LAYER_IDS.DESA_FILL);

    // Filter CQL: hanya desa yang ada di kecamatan ini
    const kecamatanFilter = `kec='${breadcrumbState.kec}'`;
    await loadLayer(mapInstance, LAYER_TYPES.KECAMATAN, SOURCE_IDS.ZOOM_KECAMATAN, LAYER_IDS.KECAMATAN_FILL, kecamatanFilter);
    await waitForSourceData(mapInstance, SOURCE_IDS.ZOOM_KECAMATAN);
    zoomToMatchingFeature(mapInstance, SOURCE_IDS.ZOOM_KECAMATAN, "kec", breadcrumbState.kec);
    
    // Load GEE coverage (untuk kecamatan dipilih) dan layer desa
    await loadGEEPolygonRaster(mapInstance, { kec: breadcrumbState.kec });
    await loadLayer(mapInstance, LAYER_TYPES.DESA, SOURCE_IDS.DESA, LAYER_IDS.DESA_FILL, `kec='${breadcrumbState.kec}'`);
    removeLayerAndSource(mapInstance, LAYER_IDS.KECAMATAN_FILL);

    return;
  }

  // LEVEL 3: User pilih desa → zoom ke desa spesifik
  if (adminLevel === "desa" && breadcrumbState.kab && breadcrumbState.kec && breadcrumbState.des) {
    // Filter CQL: desa di kabupaten dan kecamatan tertentu
    const desaFilter = `kab='${breadcrumbState.kab}' AND kec='${breadcrumbState.kec}'`;
    
    // Load zoom layer untuk navigasi yang halus
    await loadLayer(mapInstance, LAYER_TYPES.DESA, SOURCE_IDS.ZOOM_DESA, LAYER_IDS.DESA_FILL, desaFilter);
    await waitForSourceData(mapInstance, SOURCE_IDS.ZOOM_DESA);
    zoomToMatchingFeature(mapInstance, SOURCE_IDS.ZOOM_DESA, "des", breadcrumbState.des);
    
    // Load GEE coverage untuk desa dipilih dan layer desa boundaries
    await loadGEEPolygonRaster(mapInstance, { des: breadcrumbState.des });
    await loadLayer(mapInstance, LAYER_TYPES.DESA, SOURCE_IDS.DESA, LAYER_IDS.DESA_FILL, desaFilter);
    removeLayerAndSource(mapInstance, LAYER_IDS.DESA_FILL);
  }
}
