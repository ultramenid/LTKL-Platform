// src/store/mapLayersStore.ts
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";
import { useMapStore } from "./mapStore";

const GEOSERVER_URL = "https://aws.simontini.id/geoserver/ows";
const DEFAULT_CENTER: [number, number] = [120.216667, -1.5];
const DEFAULT_ZOOM = 4;


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

// ✅ GEE Raster Loader
export async function loadGEEPolygonRaster(map: maplibregl.Map, filters: Record<string, string> = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const url = `https://gee.simontini.id/gee/lulc${query ? `?${query}` : ""}`;

    console.log("🌍 Fetching GEE layer:", url);
    const response = await fetch(url);
    const tileUrl = await response.text();

    const oldLayerId = "gee-lulc-layer";
    const oldSourceId = "gee-lulc";

    // 🕊️ Fade out the old layer smoothly (if it exists)
    if (map.getLayer(oldLayerId)) {
      map.setPaintProperty(oldLayerId, "raster-opacity", 0);
      await new Promise((resolve) => setTimeout(resolve, 100)); // wait fade-out
      map.removeLayer(oldLayerId);
    }
    if (map.getSource(oldSourceId)) {
      map.removeSource(oldSourceId);
    }

    // 🆕 Add the new raster source + layer
    map.addSource("gee-lulc", {
      type: "raster",
      tiles: [tileUrl],
      tileSize: 256,
    });

    map.addLayer({
      id: "gee-lulc-layer",
      type: "raster",
      source: "gee-lulc",
      paint: {
        "raster-opacity": 0, // start invisible
        "raster-fade-duration": 500, // smooth fade transition
      },
    });

    // 🌅 Fade it in
    await new Promise((resolve) => setTimeout(resolve, 100));
    map.setPaintProperty("gee-lulc-layer", "raster-opacity", 1);

    console.log("✅ GEE LULC layer loaded (smooth transition)");
  } catch (err) {
    console.error("❌ Failed to load GEE LULC raster:", err);
  }
}



 // Generic layer loader
  export const loadLayer = async <FeatureType extends KabupatenFeature | KecamatanFeature | DesaFeature>(
    map: MapLibreMap,
    layerName: string,
    sourceId: string,
    layerId: string,
    cqlFilter?: string,
    removeLayerIds: string[] = []
  ): Promise<FeatureCollection<FeatureType["geometry"], FeatureType["properties"]>> => {
    const { updateBreadcrumb } = useMapStore.getState();
    removeLayerIds.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      const srcId = id.replace("-fill", "-src");
      if (map.getSource(srcId)) map.removeSource(srcId);
    });

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

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource(sourceId, { type: "geojson", data: geojson });
      map.addLayer({
        id: layerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": 'transparent',
          "fill-opacity": 0.5,
          "fill-outline-color": "white",
        },
      });

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

      
      map.on("mouseenter", layerId, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; popup.remove(); });

      map.on("mousemove", layerId, (e) => {
        const feature = e.features?.[0] as FeatureType | undefined;
        if (!feature) return;
        const html = "des" in feature.properties
          ? feature.properties.des
          : "kec" in feature.properties
          ? feature.properties.kec
          : feature.properties.kab;
        popup.setLngLat(e.lngLat).setHTML(`<strong>${html}</strong>`).addTo(map);
      });

      map.on("click", layerId, async (e) => {
        const feature = e.features?.[0] as FeatureType | undefined;
        if (!feature) return;

        if ("des" in feature.properties) {
          updateBreadcrumb("kabupaten", feature.properties.kab);
          updateBreadcrumb("kecamatan", feature.properties.kec);
          updateBreadcrumb("desa", feature.properties.des);
          zoomToFeature(map, feature);
          await loadGEEPolygonRaster(map, { des: feature.properties.des });
          await loadLayer<DesaFeature>(
            map,
            "LTKL:desa",
            "desa-src",
            "desa-fill",
            `kab='${feature.properties.kab}' AND kec='${feature.properties.kec}' AND des='${feature.properties.des}'`,
            ["kabupaten-fill", "kecamatan-fill", "desa-fill"]
          );

        } else if ("kec" in feature.properties) {
          updateBreadcrumb("kabupaten", feature.properties.kab);
          updateBreadcrumb("kecamatan", feature.properties.kec);
          zoomToFeature(map, feature);
          await loadGEEPolygonRaster(map, { kec: feature.properties.kec });
          await loadLayer<DesaFeature>(
            map,
            "LTKL:desa",
            "desa-src",
            "desa-fill",
            `kab='${feature.properties.kab}' AND kec='${feature.properties.kec}'`,
            ["kabupaten-fill", "kecamatan-fill"]
          );
        } else if ("kab" in feature.properties) {
          updateBreadcrumb("kabupaten", feature.properties.kab);
          zoomToFeature(map, feature);
          await loadGEEPolygonRaster(map, { kab: feature.properties.kab });
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

    return geojson;
  };

// ✅ Zoom utility
export const zoomToFeature = (
  map: MapLibreMap,
  feature: KabupatenFeature | KecamatanFeature | DesaFeature
) => {
  const coords: [number, number][] = [];

  if (feature.geometry.type === "Polygon") {
    feature.geometry.coordinates.forEach((ring) =>
      ring.forEach(([lon, lat]) => coords.push([lon, lat]))
    );
  } else if (feature.geometry.type === "MultiPolygon") {
    feature.geometry.coordinates.forEach((polygon) =>
      polygon.forEach((ring) =>
        ring.forEach(([lon, lat]) => coords.push([lon, lat]))
      )
    );
  }

  if (coords.length > 0) {
    const lons = coords.map(([lon]) => lon);
    const lats = coords.map(([_, lat]) => lat);
    map.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding: 40, duration: 1000 }
    );
  }
};

// ✅ Handle home
export const handleHome = async (map: MapLibreMap) => {
  const { resetBreadcrumbs } = useMapStore.getState();

  ["desa-fill", "kecamatan-fill", "kabupaten-fill"].forEach((id) => {
    const highlightLayerId = id + "-highlight";
    if (map.getLayer(highlightLayerId)) map.removeLayer(highlightLayerId);
    if (map.getLayer(id)) map.removeLayer(id);
    const sourceId = id.replace("-fill", "-src");
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  });

  resetBreadcrumbs();
  map.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
  await loadLayer<KabupatenFeature>(
    map,
    "LTKL:kabupaten",
    "kabupaten-src",
    "kabupaten-fill",
    "#4ade80"
  );
  await loadGEEPolygonRaster(map);
};
