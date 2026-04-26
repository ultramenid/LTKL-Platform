import { loadGEEPolygonRaster, loadLayer, removeLayerAndSource } from "../store/mapLayerStore.js";
import { zoomToMatchingFeature, waitForSourceData } from "./mapUtils.js";
import { LAYER_TYPES, SOURCE_IDS, LAYER_IDS } from "../config/constants.js";
import { buildSingleFilter, buildDesaFilter } from "./filterBuilder.js";

// Load layers untuk drill-down ke level tertentu: zoom, GEE coverage, dan layer berikutnya
export const loadLevelLayers = async (mapInstance, breadcrumbData, adminLevel) => {
  const levelConfigMap = {
    kab: {
      layerType: LAYER_TYPES.KABUPATEN,
      zoomSourceId: SOURCE_IDS.ZOOM_KABUPATEN,
      zoomLayerId: LAYER_IDS.KABUPATEN_FILL,
      zoomCqlFilter: buildSingleFilter('kab', breadcrumbData.kab),
      zoomPropertyName: "kab",
      geeRasterFilter: { kab: breadcrumbData.kab },
      nextLevelType: LAYER_TYPES.KECAMATAN,
      nextLevelCqlFilter: buildSingleFilter('kab', breadcrumbData.kab),
    },
    kec: {
      layerType: LAYER_TYPES.KECAMATAN,
      zoomSourceId: SOURCE_IDS.ZOOM_KECAMATAN,
      zoomLayerId: LAYER_IDS.KECAMATAN_FILL,
      zoomCqlFilter: buildSingleFilter('kec', breadcrumbData.kec),
      zoomPropertyName: "kec",
      geeRasterFilter: { kec: breadcrumbData.kec },
      nextLevelType: LAYER_TYPES.DESA,
      nextLevelCqlFilter: buildSingleFilter('kec', breadcrumbData.kec),
    },
  }[adminLevel];

  if (!levelConfigMap) return;

  const nextSourceId = adminLevel === "kab" ? SOURCE_IDS.KECAMATAN : SOURCE_IDS.DESA;
  const nextLayerId = adminLevel === "kab" ? LAYER_IDS.KECAMATAN_FILL : LAYER_IDS.DESA_FILL;
  
  await loadLayer(mapInstance, levelConfigMap.layerType, levelConfigMap.zoomSourceId, levelConfigMap.zoomLayerId, levelConfigMap.zoomCqlFilter);
  await waitForSourceData(mapInstance, levelConfigMap.zoomSourceId);
  zoomToMatchingFeature(mapInstance, levelConfigMap.zoomSourceId, levelConfigMap.zoomPropertyName, breadcrumbData[adminLevel]);
  await loadGEEPolygonRaster(mapInstance, levelConfigMap.geeRasterFilter);
  await loadLayer(mapInstance, levelConfigMap.nextLevelType, nextSourceId, nextLayerId, levelConfigMap.nextLevelCqlFilter);

  // Hapus zoom layer; removeLayerAndSource cari source dari map style (bukan pattern derivation)
  // agar zoomkabupaten-src / zoomkecamatan-src bisa di-cleanup dengan benar
  removeLayerAndSource(mapInstance, levelConfigMap.zoomLayerId);
};

// Load desa (leaf level) — tidak pakai zoom layer terpisah
export const loadDesaLevel = async (mapInstance, breadcrumbData) => {
  // buildDesaFilter butuh kab + kec + des agar tidak ambil desa dengan nama sama di kec berbeda
  const desaCqlFilter = buildDesaFilter(breadcrumbData);
  
  await loadLayer(
    mapInstance,
    LAYER_TYPES.DESA,
    SOURCE_IDS.DESA,
    LAYER_IDS.DESA_FILL,
    desaCqlFilter
  );
  
  await loadGEEPolygonRaster(mapInstance, { des: breadcrumbData.des });

  // Tunggu source desa benar-benar siap sebelum zoom — event-driven lebih reliable dari setTimeout
  await waitForSourceData(mapInstance, SOURCE_IDS.DESA);

  zoomToMatchingFeature(mapInstance, SOURCE_IDS.DESA, "des", breadcrumbData.des);
};

// Catatan: event handlers hover/click diatur di mapLayerStore.js via attachLayerInteraction
