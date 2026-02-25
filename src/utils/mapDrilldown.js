import { loadGEEPolygonRaster, loadLayer } from "../store/mapLayerStore.js";
import { zoomToMatchingFeature } from "./mapUtils.js";
import { useMapStore } from "../store/mapStore.js";

const LAYER_NAMES = ["desa-fill", "kecamatan-fill", "kabupaten-fill"];

// Helper: Remove multiple layers sekaligus
function removeMultipleLayers(map, layerIds) {
  layerIds.forEach((id) => {
    // Hapus hover line dulu
    const hoverLineId = `${id}-hover-line`;
    if (map.getLayer(hoverLineId)) map.removeLayer(hoverLineId);
    
    // Baru remove main layer
    if (map.getLayer(id)) map.removeLayer(id);
    
    // Terakhir remove source
    const sourceId = id.replace("-fill", "-src");
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  });
}

export async function handleHomeReset(
  map,
  resetBreadcrumbs,
  defaultCenter,
  defaultZoom
) {
  if (!map) return;

  // Cleanup semua layers (hover line dulu, baru source)
  LAYER_NAMES.forEach((id) => {
    const hoverLineId = `${id}-hover-line`;
    if (map.getLayer(hoverLineId)) map.removeLayer(hoverLineId);
    
    const highlightLayerId = `${id}-highlight`;
    if (map.getLayer(highlightLayerId)) map.removeLayer(highlightLayerId);
    
    if (map.getLayer(id)) map.removeLayer(id);
    
    const sourceId = id.replace("-fill", "-src");
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  });

  resetBreadcrumbs();
  useMapStore.getState().setSelectedKab(null);
  map.flyTo({ center: defaultCenter, zoom: defaultZoom });

  await loadLayer(
    map,
    "LTKL:kabupaten",
    "kabupaten-src",
    "kabupaten-fill"
  );
  await loadGEEPolygonRaster(map);
}

export async function handleBreadcrumbDrill(
  map,
  level,
  breadcrumbs,
  updateBreadcrumb
) {
  if (!map) return;

  if (level === "kabupaten" && breadcrumbs.kab) {
    updateBreadcrumb("kecamatan", undefined);
    updateBreadcrumb("desa", undefined);

    // Cleanup yang lebih detail
    removeMultipleLayers(map, ["desa-fill", "kecamatan-fill"]);

    await loadLayer(
      map,
      "LTKL:kabupaten",
      "zoomkabupaten-src",
      "zoomkabupaten-fill",
      `kab='${breadcrumbs.kab}'`
    );

    zoomToMatchingFeature(map, "zoomkabupaten-src", "kab", breadcrumbs.kab);

    await loadGEEPolygonRaster(map, { kab: breadcrumbs.kab });

    await loadLayer(
      map,
      "LTKL:kecamatan",
      "kecamatan-src",
      "kecamatan-fill",
      `kab='${breadcrumbs.kab}'`
    );

    if (map.getLayer("zoomkabupaten-fill")) {
      map.removeLayer("zoomkabupaten-fill");
    }

    return;
  }

  if (level === "kecamatan" && breadcrumbs.kab && breadcrumbs.kec) {
    updateBreadcrumb("desa", undefined);

    removeMultipleLayers(map, ["desa-fill"]);

    await loadLayer(
      map,
      "LTKL:kecamatan",
      "zoomkecamatan-src",
      "zoomkecamatan-fill",
      `kec='${breadcrumbs.kec}'`
    );

    zoomToMatchingFeature(map, "zoomkecamatan-src", "kec", breadcrumbs.kec);

    await loadGEEPolygonRaster(map, { kec: breadcrumbs.kec });

    await loadLayer(
      map,
      "LTKL:desa",
      "desa-src",
      "desa-fill",
      `kec='${breadcrumbs.kec}'`
    );

    if (map.getLayer("zoomkecamatan-fill")) {
      map.removeLayer("zoomkecamatan-fill");
    }

    return;
  }

  if (level === "desa" && breadcrumbs.kab && breadcrumbs.kec && breadcrumbs.des) {
    await loadGEEPolygonRaster(map, { des: breadcrumbs.des });

    await loadLayer(
      map,
      "LTKL:desa",
      "desa-src",
      "desa-fill",
      `kab='${breadcrumbs.kab}' AND kec='${breadcrumbs.kec}'`
    );

    zoomToMatchingFeature(map, "desa-src", "des", breadcrumbs.des);
  }
}
