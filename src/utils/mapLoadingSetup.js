import { loadGEEPolygonRaster, loadLayer, removeLayerAndSource } from "../store/mapLayerStore.js";
import { zoomToMatchingFeature, waitForSourceData } from "../utils/mapUtils.js";
import { LAYER_TYPES, SOURCE_IDS, LAYER_IDS } from "../config/constants.js";

// Load layers untuk navigasi drill-down ke level administratif (kabupaten atau kecamatan)
// Contoh: loadLevelLayers(map, {kab: 'Bantul'}, 'kab')
// → Load kabupaten Bantul, zoom ke Bantul, load GEE coverage, load kecamatan di Bantul
export const loadLevelLayers = async (mapInstance, breadcrumbData, adminLevel) => {
  // Config template untuk setiap level drill-down (kabupaten, kecamatan)
  // Berisi info layer, filter CQL, dan properti yang diperlukan untuk setiap level
  const levelConfigMap = {
    kab: {
      // Layer untuk zoom ke shape kabupaten
      layerType: LAYER_TYPES.KABUPATEN,
      zoomSourceId: SOURCE_IDS.ZOOM_KABUPATEN,
      zoomLayerId: LAYER_IDS.KABUPATEN_FILL,
      // Filter CQL: hanya kabupaten yang dipilih
      zoomCqlFilter: `kab='${breadcrumbData.kab}'`,
      zoomPropertyName: "kab",
      // Filter untuk GEE raster coverage
      geeRasterFilter: { kab: breadcrumbData.kab },
      // Layer berikutnya: kecamatan di dalam kabupaten ini
      nextLevelType: LAYER_TYPES.KECAMATAN,
      nextLevelCqlFilter: `kab='${breadcrumbData.kab}'`,
    },
    kec: {
      // Layer untuk zoom ke shape kecamatan
      layerType: LAYER_TYPES.KECAMATAN,
      zoomSourceId: SOURCE_IDS.ZOOM_KECAMATAN,
      zoomLayerId: LAYER_IDS.KECAMATAN_FILL,
      // Filter CQL: hanya kecamatan yang dipilih
      zoomCqlFilter: `kec='${breadcrumbData.kec}'`,
      zoomPropertyName: "kec",
      // Filter untuk GEE raster coverage
      geeRasterFilter: { kec: breadcrumbData.kec },
      // Layer berikutnya: desa di dalam kecamatan ini
      nextLevelType: LAYER_TYPES.DESA,
      nextLevelCqlFilter: `kec='${breadcrumbData.kec}'`,
    },
  }[adminLevel];

  if (!levelConfigMap) return;

  // Tentukan source & layer ID untuk level berikutnya berdasarkan level saat ini
  const nextSourceId = adminLevel === "kab" ? SOURCE_IDS.KECAMATAN : SOURCE_IDS.DESA;
  const nextLayerId = adminLevel === "kab" ? LAYER_IDS.KECAMATAN_FILL : LAYER_IDS.DESA_FILL;
  
  // Flow: Load zoom layer → Zoom ke shape → Load GEE coverage → Load layer berikutnya
  await loadLayer(mapInstance, levelConfigMap.layerType, levelConfigMap.zoomSourceId, levelConfigMap.zoomLayerId, levelConfigMap.zoomCqlFilter);
  await waitForSourceData(mapInstance, levelConfigMap.zoomSourceId);
  zoomToMatchingFeature(mapInstance, levelConfigMap.zoomSourceId, levelConfigMap.zoomPropertyName, breadcrumbData[adminLevel]);
  await loadGEEPolygonRaster(mapInstance, levelConfigMap.geeRasterFilter);
  await loadLayer(mapInstance, levelConfigMap.nextLevelType, nextSourceId, nextLayerId, levelConfigMap.nextLevelCqlFilter);

  // Cleanup: hapus zoom layer + semua hover-line yang masih reference sourcenya
  // removeLayerAndSource mencari source actual dari map style (bukan pattern derivation)
  // sehingga zoomkabupaten-src / zoomkecamatan-src bisa di-cleanup dengan benar
  removeLayerAndSource(mapInstance, levelConfigMap.zoomLayerId);
};

// Load layer desa level (tidak perlu zoom layer terpisah, beri waktu untuk data ready)
// Contoh: loadDesaLevel(map, {kab: 'Bantul', kec: 'Sleman', des: 'Banyudono'})
// Berbeda dari loadLevelLayers: desa adalah level paling dalam (leaf level)
export const loadDesaLevel = async (mapInstance, breadcrumbData) => {
  // Filter menggunakan 3 level untuk precision: kab, kec, dan desa
  // Ini memastikan kita get shape yang tepat (tidak ada desa dengan nama sama di kec berbeda)
  const desaCqlFilter = `kab='${breadcrumbData.kab}' AND kec='${breadcrumbData.kec}' AND des='${breadcrumbData.des}'`;
  
  // Load layer desa dengan filter presisi
  await loadLayer(
    mapInstance,
    LAYER_TYPES.DESA,
    SOURCE_IDS.DESA,
    LAYER_IDS.DESA_FILL,
    desaCqlFilter
  );
  
  // Load GEE coverage untuk desa yang dipilih
  await loadGEEPolygonRaster(mapInstance, { des: breadcrumbData.des });
  
  // Tunggu sebentar agar data benar-benar siap di map (avoid race condition)
  await new Promise(resolveWaiting => setTimeout(resolveWaiting, 200));
  
  // Zoom ke shape desa yang dipilih
  zoomToMatchingFeature(mapInstance, SOURCE_IDS.DESA, "des", breadcrumbData.des);
};

// Catatan: Event handlers (hover cursor, click interactions) diatur di mapLayerStore.js
// Melalui fungsi attachLayerInteraction
