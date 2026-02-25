import type maplibregl from "maplibre-gl";
import type {
  KabupatenFeature,
  KecamatanFeature,
  DesaFeature,
} from "../store/mapLayerStore";
import { loadGEEPolygonRaster, loadLayer } from "../store/mapLayerStore";
import { zoomToMatchingFeature } from "./mapUtils";
import type { Breadcrumbs, Level } from "../store/mapStore";

export async function handleHomeReset(
  map: maplibregl.Map | null,
  resetBreadcrumbs: () => void,
  defaultCenter: [number, number],
  defaultZoom: number
) {
  if (!map) return;

  ["desa-fill", "kecamatan-fill", "kabupaten-fill"].forEach((id) => {
    const highlightLayerId = `${id}-highlight`;
    if (map.getLayer(highlightLayerId)) map.removeLayer(highlightLayerId);
    if (map.getLayer(id)) map.removeLayer(id);
    const sourceId = id.replace("-fill", "-src");
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  });

  resetBreadcrumbs();
  map.flyTo({ center: defaultCenter, zoom: defaultZoom });

  await loadLayer<KabupatenFeature>(
    map,
    "LTKL:kabupaten",
    "kabupaten-src",
    "kabupaten-fill"
  );
  await loadGEEPolygonRaster(map);
}

export async function handleBreadcrumbDrill(
  map: maplibregl.Map | null,
  level: Exclude<Level, "home">,
  breadcrumbs: Breadcrumbs,
  updateBreadcrumb: (level: Level, value?: string) => void
) {
  if (!map) return;

  if (level === "kabupaten" && breadcrumbs.kab) {
    updateBreadcrumb("kecamatan", undefined);
    updateBreadcrumb("desa", undefined);

    ["desa-fill", "kecamatan-fill"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    ["desa-src", "kecamatan-src"].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });

    await loadLayer<KabupatenFeature>(
      map,
      "LTKL:kabupaten",
      "zoomkabupaten-src",
      "zoomkabupaten-fill",
      `kab='${breadcrumbs.kab}'`
    );

    zoomToMatchingFeature(map, "zoomkabupaten-src", "kab", breadcrumbs.kab);

    await loadGEEPolygonRaster(map, { kab: breadcrumbs.kab });

    await loadLayer<KabupatenFeature>(
      map,
      "LTKL:kecamatan",
      "kabupaten-src",
      "kabupaten-fill",
      `kab='${breadcrumbs.kab}'`
    );

    if (map.getLayer("zoomkabupaten-fill")) {
      map.removeLayer("zoomkabupaten-fill");
    }

    return;
  }

  if (level === "kecamatan" && breadcrumbs.kab && breadcrumbs.kec) {
    updateBreadcrumb("desa", undefined);

    if (map.getLayer("desa-fill")) map.removeLayer("desa-fill");
    if (map.getSource("desa-src")) map.removeSource("desa-src");

    await loadLayer<KecamatanFeature>(
      map,
      "LTKL:kecamatan",
      "zoomkecamatan-src",
      "zoomkecamatan-fill",
      `kec='${breadcrumbs.kec}'`
    );

    zoomToMatchingFeature(map, "zoomkecamatan-src", "kec", breadcrumbs.kec);

    await loadGEEPolygonRaster(map, { kec: breadcrumbs.kec });

    await loadLayer<KecamatanFeature>(
      map,
      "LTKL:desa",
      "kecamatan-src",
      "kecamatan-fill",
      `kec='${breadcrumbs.kec}'`
    );

    if (map.getLayer("zoomkecamatan-fill")) {
      map.removeLayer("zoomkecamatan-fill");
    }

    return;
  }

  if (level === "desa" && breadcrumbs.kab && breadcrumbs.kec && breadcrumbs.des) {
    await loadGEEPolygonRaster(map, { des: breadcrumbs.des });

    await loadLayer<DesaFeature>(
      map,
      "LTKL:desa",
      "desa-src",
      "desa-fill",
      `kab='${breadcrumbs.kab}' AND kec='${breadcrumbs.kec}'`
    );

    zoomToMatchingFeature(map, "desa-src", "des", breadcrumbs.des);
  }
}

