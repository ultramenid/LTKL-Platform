import {
  abortActiveRequests,
  getActiveSignal,
  loadGEEPolygonRaster,
  loadLayer,
  removeGEERasterLayer,
  removeLayerAndSource,
} from '../store/mapLayerStore.js';
import { zoomToMatchingFeature, waitForSourceData } from './mapUtils.js';
import { LAYER_IDS, LAYER_TYPES, SOURCE_IDS } from '../config/constants.js';
import { buildSingleFilter, buildDesaFilter } from './filterBuilder.js';

const MAIN_LAYER_IDS = [LAYER_IDS.DESA_FILL, LAYER_IDS.KECAMATAN_FILL, LAYER_IDS.KABUPATEN_FILL];

const isAbortError = (error) => error?.name === 'AbortError';

const buildGeeFilter = (target) => {
  const filter = {};
  if (target.kabupaten) filter.kab = target.kabupaten;
  if (target.kecamatan) filter.kec = target.kecamatan;
  if (target.desa) filter.des = target.desa;
  if (target.year) filter.year = String(target.year);
  return filter;
};

const clearMainLayers = (map) => {
  MAIN_LAYER_IDS.forEach((layerId) => removeLayerAndSource(map, layerId));
  removeGEERasterLayer(map);
};

export async function transitionMainMap({ map, target, setLoading, shouldCommit = () => true }) {
  if (!map) return;

  abortActiveRequests();
  const signal = getActiveSignal();
  if (shouldCommit()) setLoading?.(true);
  clearMainLayers(map);

  try {
    if (target.desa) {
      const desaFilter = buildDesaFilter({
        kab: target.kabupaten,
        kec: target.kecamatan,
        des: target.desa,
      });
      const desaGeoJson = await loadLayer(map, LAYER_TYPES.DESA, SOURCE_IDS.DESA, LAYER_IDS.DESA_FILL, desaFilter, [], signal);
      await waitForSourceData(map, SOURCE_IDS.DESA, signal);
      zoomToMatchingFeature(map, desaGeoJson, 'des', target.desa);
      await loadGEEPolygonRaster(map, buildGeeFilter(target), signal);
      return;
    }

    if (target.kecamatan) {
      const kecamatanFilter = buildSingleFilter('kec', target.kecamatan);
      const kecamatanGeoJson = await loadLayer(
        map,
        LAYER_TYPES.KECAMATAN,
        SOURCE_IDS.ZOOM_KECAMATAN,
        LAYER_IDS.KECAMATAN_FILL,
        kecamatanFilter,
        [],
        signal,
      );
      await waitForSourceData(map, SOURCE_IDS.ZOOM_KECAMATAN, signal);
      zoomToMatchingFeature(map, kecamatanGeoJson, 'kec', target.kecamatan);
      await loadGEEPolygonRaster(map, buildGeeFilter(target), signal);
      await loadLayer(
        map,
        LAYER_TYPES.DESA,
        SOURCE_IDS.DESA,
        LAYER_IDS.DESA_FILL,
        kecamatanFilter,
        [],
        signal,
      );
      removeLayerAndSource(map, LAYER_IDS.KECAMATAN_FILL);
      return;
    }

    if (target.kabupaten) {
      const kabupatenFilter = buildSingleFilter('kab', target.kabupaten);
      const kabupatenGeoJson = await loadLayer(
        map,
        LAYER_TYPES.KABUPATEN,
        SOURCE_IDS.ZOOM_KABUPATEN,
        LAYER_IDS.KABUPATEN_FILL,
        kabupatenFilter,
        [],
        signal,
      );
      await waitForSourceData(map, SOURCE_IDS.ZOOM_KABUPATEN, signal);
      zoomToMatchingFeature(map, kabupatenGeoJson, 'kab', target.kabupaten);
      await loadGEEPolygonRaster(map, buildGeeFilter(target), signal);
      await loadLayer(
        map,
        LAYER_TYPES.KECAMATAN,
        SOURCE_IDS.KECAMATAN,
        LAYER_IDS.KECAMATAN_FILL,
        kabupatenFilter,
        [],
        signal,
      );
      removeLayerAndSource(map, LAYER_IDS.KABUPATEN_FILL);
      return;
    }

    await loadLayer(
      map,
      LAYER_TYPES.KABUPATEN,
      SOURCE_IDS.KABUPATEN,
      LAYER_IDS.KABUPATEN_FILL,
      undefined,
      [],
      signal,
    );
    await loadGEEPolygonRaster(map, buildGeeFilter(target), signal);
  } catch (error) {
    if (!isAbortError(error)) throw error;
  } finally {
    if (shouldCommit()) setLoading?.(false);
  }
}
