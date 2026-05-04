import { loadGEEPolygonRaster, loadLayer, removeLayerAndSource } from '../store/mapLayerStore.js';
import { zoomToMatchingFeature, waitForSourceData } from './mapUtils.js';
import { LAYER_TYPES, SOURCE_IDS, LAYER_IDS } from '../config/constants.js';
import { buildSingleFilter, buildDesaFilter } from './filterBuilder.js';

// Load layers for drill-down to a specific level: zoom, GEE coverage, and next-level layer
export const loadLevelLayers = async (mapInstance, breadcrumbData, adminLevel) => {
  const levelConfigMap = {
    kab: {
      layerType: LAYER_TYPES.KABUPATEN,
      zoomSourceId: SOURCE_IDS.ZOOM_KABUPATEN,
      zoomLayerId: LAYER_IDS.KABUPATEN_FILL,
      zoomCqlFilter: buildSingleFilter('kab', breadcrumbData.kab),
      zoomPropertyName: 'kab',
      geeRasterFilter: { kab: breadcrumbData.kab },
      nextLevelType: LAYER_TYPES.KECAMATAN,
      nextLevelCqlFilter: buildSingleFilter('kab', breadcrumbData.kab),
    },
    kec: {
      layerType: LAYER_TYPES.KECAMATAN,
      zoomSourceId: SOURCE_IDS.ZOOM_KECAMATAN,
      zoomLayerId: LAYER_IDS.KECAMATAN_FILL,
      zoomCqlFilter: buildSingleFilter('kec', breadcrumbData.kec),
      zoomPropertyName: 'kec',
      geeRasterFilter: { kec: breadcrumbData.kec },
      nextLevelType: LAYER_TYPES.DESA,
      nextLevelCqlFilter: buildSingleFilter('kec', breadcrumbData.kec),
    },
  }[adminLevel];

  if (!levelConfigMap) return;

  const nextSourceId = adminLevel === 'kab' ? SOURCE_IDS.KECAMATAN : SOURCE_IDS.DESA;
  const nextLayerId = adminLevel === 'kab' ? LAYER_IDS.KECAMATAN_FILL : LAYER_IDS.DESA_FILL;

  await loadLayer(
    mapInstance,
    levelConfigMap.layerType,
    levelConfigMap.zoomSourceId,
    levelConfigMap.zoomLayerId,
    levelConfigMap.zoomCqlFilter,
  );
  await waitForSourceData(mapInstance, levelConfigMap.zoomSourceId);
  zoomToMatchingFeature(
    mapInstance,
    levelConfigMap.zoomSourceId,
    levelConfigMap.zoomPropertyName,
    breadcrumbData[adminLevel],
  );
  await loadGEEPolygonRaster(mapInstance, levelConfigMap.geeRasterFilter);
  await loadLayer(
    mapInstance,
    levelConfigMap.nextLevelType,
    nextSourceId,
    nextLayerId,
    levelConfigMap.nextLevelCqlFilter,
  );

  // Remove zoom layer; removeLayerAndSource finds source from map style (not pattern derivation)
  // so zoomkabupaten-src / zoomkecamatan-src can be cleaned up correctly
  removeLayerAndSource(mapInstance, levelConfigMap.zoomLayerId);
};

// Load desa (leaf level) — no separate zoom layer needed
export const loadDesaLevel = async (mapInstance, breadcrumbData) => {
  // buildDesaFilter needs kab + kec + des to avoid fetching desa with same name in different kec
  const desaCqlFilter = buildDesaFilter(breadcrumbData);

  await loadLayer(
    mapInstance,
    LAYER_TYPES.DESA,
    SOURCE_IDS.DESA,
    LAYER_IDS.DESA_FILL,
    desaCqlFilter,
  );

  await loadGEEPolygonRaster(mapInstance, { des: breadcrumbData.des });

  // Wait for desa source to be ready before zooming — event-driven is more reliable than setTimeout
  await waitForSourceData(mapInstance, SOURCE_IDS.DESA);

  zoomToMatchingFeature(mapInstance, SOURCE_IDS.DESA, 'des', breadcrumbData.des);
};

// Note: hover/click event handlers are managed in mapLayerStore.js via attachInteractions + handleGlobalDrillDown
