// src/store/mapLayersStore.ts
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";
import { useMapStore } from "./mapStore";
import { zoomToFeature } from "../utils/mapUtils";

export const GEOSERVER_URL = "https://aws.simontini.id/geoserver/ows";
export const TILE_SERVER_URL = "https://gee.simontini.id/gee"; // Example tile server URL


// Feature interfaces
export interface KabupatenFeature {
  type: "Feature";
  geometry: Polygon | MultiPolygon;
  properties: { kab: string };
}
export interface KecamatanFeature {
  type: "Feature";
  geometry: Polygon | MultiPolygon;
  properties: { kab: string; kec: string };
}
export interface DesaFeature {
  type: "Feature";
  geometry: Polygon | MultiPolygon;
  properties: { kab: string; kec: string; des: string };
}


export async function loadGEEPolygonRaster(
  map: maplibregl.Map,
  filters: Record<string, string> = {}
) {
  try {
     //Get current year from global store
    const { year } = useMapStore.getState();

    //Merge filters (kab/kec/des + year)
    const query = new URLSearchParams({
      ...filters,
      year: String(year),
    }).toString();

    const url = TILE_SERVER_URL+`/lulc${query ? `?${query}` : ""}`;
    console.log(`🌍 Fetching GEE layer for year ${year}:`, url);

    // 🛰️ Fetch tile URL
    const response = await fetch(url);
    const tileUrl = await response.text();

    // Handle empty response
    if (!tileUrl) {
      console.warn("⚠️ No tile URL received from GEE");
      return;
    }

    // Remove old layer/source before adding the new one
    if (map.getLayer("gee-lulc-layer")) map.removeLayer("gee-lulc-layer");
    if (map.getSource("gee-lulc")) map.removeSource("gee-lulc");

    // Add the new raster source
    map.addSource("gee-lulc", {
      type: "raster",
      tiles: [tileUrl],
      tileSize: 256,
    });

    // Determine where to insert this raster (it should be below everything else)
    const allLayers = map.getStyle()?.layers ?? [];
    const beforeId =
      allLayers.find((layer) =>
        ["kabupaten-fill", "kecamatan-fill", "desa-fill"].includes(layer.id)
      )?.id || undefined;

    // Add raster layer at the correct position
    map.addLayer(
      {
        id: "gee-lulc-layer",
        type: "raster",
        source: "gee-lulc",
        paint: {
          "raster-opacity": 1,
        },
      },
      beforeId // ensures raster is drawn below polygons
    );

    console.log(`GEE LULC layer loaded successfully for year ${year}`);
  } catch (err) {
    console.error("Failed to load GEE LULC raster:", err);
  }
}


 // Generic layer loader
 export const loadLayer = async < FeatureType extends KabupatenFeature | KecamatanFeature | DesaFeature >(
  map: MapLibreMap,
  layerName: string,
  sourceId: string,
  layerId: string,
  cqlFilter?: string,
  removeLayerIds: string[] = []
): Promise<FeatureCollection<FeatureType["geometry"], FeatureType["properties"]>> => {

  // Clean up old layers
  removeLayerIds.forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
    const srcId = id.replace("-fill", "-src");
    if (map.getSource(srcId)) map.removeSource(srcId);
  });

  // Fetch GeoServer data
  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: layerName,
    outputFormat: "application/json",
  });
  if (cqlFilter) params.append("CQL_FILTER", cqlFilter);

  const url = `${GEOSERVER_URL}?${params.toString()}`;
  const res = await fetch(url);
  const geojson: FeatureCollection<FeatureType["geometry"], FeatureType["properties"]> = await res.json();

  // Add or update GeoJSON source
  if (map.getSource(sourceId)) {
    (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
  } else {
    map.addSource(sourceId, { type: "geojson", data: geojson });
    map.addLayer({
      id: layerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "transparent",
        "fill-opacity": 0.5,
        "fill-outline-color": "white",
      },
    });
  }

  // Attach interaction logic ONCE
  attachLayerInteraction<FeatureType>(map, layerId);

  return geojson;
};

function attachLayerInteraction<FeatureType extends KabupatenFeature | KecamatanFeature | DesaFeature >(map: MapLibreMap, layerId: string) {
  const { updateBreadcrumb } = useMapStore.getState();
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

  // Prevent duplicate bindings
  const internalMap = map as any;
  if (!internalMap._attachedLayers) internalMap._attachedLayers = new Set<string>();
  if (internalMap._attachedLayers.has(layerId)) return;
  internalMap._attachedLayers.add(layerId);

  //  Hover popup
  map.on("mouseenter", layerId, () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
  });

  //  Hover popup
  map.on("mousemove", layerId, (e) => {
    const feature = e.features?.[0] as FeatureType | undefined;
    if (!feature) return;
    const html =
      "des" in feature.properties
        ? feature.properties.des
        : "kec" in feature.properties
        ? feature.properties.kec
        : feature.properties.kab;
    popup.setLngLat(e.lngLat).setHTML(`<strong>${html}</strong>`).addTo(map);
  });

 // Click handler (drilldown logic)
map.on("click", layerId, async (e) => {
  const feature = e.features?.[0] as FeatureType | undefined;
  if (!feature) return;

  //  DESA LEVEL (lowest)
  if ("des" in feature.properties) {
    updateBreadcrumb("kabupaten", feature.properties.kab);
    updateBreadcrumb("kecamatan", feature.properties.kec);
    updateBreadcrumb("desa", feature.properties.des);

    // Zoom to desa and load its raster
    zoomToFeature(map, feature);
    // Load GEE raster for the selected desa
    await loadGEEPolygonRaster(map, { des: feature.properties.des });

    // Remove parent boundaries (kecamatan & kabupaten)
    ["kecamatan-fill", "kabupaten-fill"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      const srcId = id.replace("-fill", "-src");
      if (map.getSource(srcId)) map.removeSource(srcId);
    });

    // Load and show only the selected desa
    if (map.getLayer("desa-fill")) map.removeLayer("desa-fill");
    if (map.getSource("desa-src")) map.removeSource("desa-src");

    // Load only the selected desa
    await loadLayer<DesaFeature>(
      map,
      "LTKL:desa",
      "desa-src",
      "desa-fill",
      `kab='${feature.properties.kab}' AND kec='${feature.properties.kec}' AND des='${feature.properties.des}'`
    );

    return;
  }

  //  KECAMATAN LEVEL → Drill into desa
  if ("kec" in feature.properties) {
    updateBreadcrumb("kabupaten", feature.properties.kab);
    updateBreadcrumb("kecamatan", feature.properties.kec);
    updateBreadcrumb("desa", undefined);

    zoomToFeature(map, feature);
    await loadGEEPolygonRaster(map, { kec: feature.properties.kec });

    //  Remove only kabupaten layer
    ["kabupaten-fill"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      const srcId = id.replace("-fill", "-src");
      if (map.getSource(srcId)) map.removeSource(srcId);
    });

    //  Load desa boundaries under this kecamatan
    await loadLayer<DesaFeature>(
      map,
      "LTKL:desa",
      "desa-src",
      "desa-fill",
      `kab='${feature.properties.kab}' AND kec='${feature.properties.kec}'`,
      ["kecamatan-fill"]
    );

    return;
  }

  // KABUPATEN LEVEL → Drill into kecamatan
  if ("kab" in feature.properties) {
    updateBreadcrumb("kabupaten", feature.properties.kab);
    updateBreadcrumb("kecamatan", undefined);
    updateBreadcrumb("desa", undefined);

    // Zoom to kabupaten and load its raster
    zoomToFeature(map, feature);
    // Load GEE raster for the selected kabupaten
    await loadGEEPolygonRaster(map, { kab: feature.properties.kab });

    //  Load kecamatan layer
    await loadLayer<KecamatanFeature>(
      map,
      "LTKL:kecamatan",
      "kecamatan-src",
      "kecamatan-fill",
      `kab='${feature.properties.kab}'`,
      ["kabupaten-fill"]
    );
  }
});

}



