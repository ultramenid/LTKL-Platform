import maplibregl from "maplibre-gl";
import { useMapStore } from "./mapStore.js";
import { zoomToFeature } from "../utils/mapUtils.js";

export const GEOSERVER_URL = "https://aws.simontini.id/geoserver/ows";
export const TILE_SERVER_URL = "https://gee.simontini.id/gee";

export async function loadGEEPolygonRaster(
  map,
  filters = {}
) {
  try {
    // Get current year from global store
    const { year } = useMapStore.getState();

    // Merge filters (kab/kec/des + year)
    const query = new URLSearchParams({
      ...filters,
      year: String(year),
    }).toString();

    const url = TILE_SERVER_URL + `${query ? `/lulc?${query}` : "/lulc"}`;
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
    
    // Bring all hover line layers to the top
    bringHoverLayersToTop(map);
  } catch (err) {
    console.error("Failed to load GEE LULC raster:", err);
  }
}

// Helper function to bring all hover line layers to the top
function bringHoverLayersToTop(map) {
  const layers = map.getStyle()?.layers ?? [];
  const hoverLineIds = layers.map(layer => layer.id).filter(id => id.includes('-hover-line'));
  
  // Move each hover line layer to the top (last added = rendered on top)
  hoverLineIds.forEach(id => {
    try {
      map.moveLayer(id, undefined); // undefined = move to top
    } catch (e) {
      // Layer might not exist anymore, skip
    }
  });
}

// Generic layer loader
export const loadLayer = async (
  map,
  layerName,
  sourceId,
  layerId,
  cqlFilter,
  removeLayerIds = []
) => {

  // Clean up old layers
  removeLayerIds.forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
    // also remove companion hover line layer if present
    const hoverLineId = `${id}-hover-line`;
    if (map.getLayer(hoverLineId)) map.removeLayer(hoverLineId);
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
  const geojson = await res.json();

  // ensure each feature has an id so feature-state highlighting works consistently
  if (Array.isArray(geojson.features)) {
    geojson.features.forEach((f, i) => {
      if (f.id === undefined) f.id = i;
    });
  }

  // Add or update GeoJSON source
  if (map.getSource(sourceId)) {
    (map.getSource(sourceId)).setData(geojson);
    // If the fill layer was removed but the source remains (e.g., during cleanup), recreate it
    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": "transparent",
          "fill-opacity": 0.5,
          "fill-outline-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#27CBFC",
            "white",
          ],
        },
      });
    }
    // ensure hover line layer exists even when updating existing source
    const hoverLineId = `${layerId}-hover-line`;
    if (!map.getLayer(hoverLineId)) {
      map.addLayer({
        id: hoverLineId,
        type: "line",
        source: sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#27CBFC",
            "rgba(0,0,0,0)",
          ],
          "line-width": 2,
          "line-opacity": 0.98,
        },
      });
    }
    else {
      // if hover line already exists, update its paint to be visible
      const existingHover = map.getLayer(hoverLineId);
      if (existingHover) {
        map.setPaintProperty(hoverLineId, "line-width", 2);
        map.setPaintProperty(hoverLineId, "line-opacity", 0.98);
        map.setPaintProperty(hoverLineId, "line-color", [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "#27CBFC",
          "rgba(0,0,0,0)",
        ]);
      }
    }
  } else {
    // ensure features have stable ids so we can use feature-state for hover
    map.addSource(sourceId, { type: "geojson", data: geojson, generateId: true });
    map.addLayer({
      id: layerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "transparent",
        "fill-opacity": 0.5,
        // outline color uses feature-state 'hover' to emphasize only the hovered polygon
        "fill-outline-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "#27CBFC", // highlight color when hovered
          "white"    // default
        ],
      },
    });
    // add a dedicated line layer above the fill to render a thicker hover stroke
    const hoverLineId = `${layerId}-hover-line`;
    if (!map.getLayer(hoverLineId)) {
      map.addLayer({
        id: hoverLineId,
        type: "line",
        source: sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          // show color only for the hovered feature via feature-state
          "line-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#27CBFC",
            "rgba(0,0,0,0)"
          ],
          "line-width": 2,
          "line-opacity": 0.98,
        },
      });
    }
  }

  // Attach interaction logic ONCE
  attachLayerInteraction(map, layerId);

  // Bring hover line layers to the top
  bringHoverLayersToTop(map);

  return geojson;
};

function attachLayerInteraction(map, layerId) {
  const { updateBreadcrumb } = useMapStore.getState();
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

  // Prevent duplicate bindings
  const internalMap = map;
  if (!internalMap._attachedLayers) internalMap._attachedLayers = new Set();
  if (internalMap._attachedLayers.has(layerId)) return;
  internalMap._attachedLayers.add(layerId);

  // Hover popup + per-feature border emphasis using feature-state
  const sourceId = layerId.replace("-fill", "-src");
  let lastHoverId = null;

  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
    // clear previous hover state
    if (lastHoverId !== null) {
      map.setFeatureState({ source: sourceId, id: lastHoverId }, { hover: false });
      lastHoverId = null;
    }
  });

  map.on("mousemove", layerId, (e) => {
    const feature = e.features?.[0];
    if (!feature) return;

    const fid = feature.id;
    // clear previous
    if (lastHoverId !== null && lastHoverId !== fid) {
      map.setFeatureState({ source: sourceId, id: lastHoverId }, { hover: false });
      lastHoverId = null;
    }

    if (fid !== undefined) {
      map.setFeatureState({ source: sourceId, id: fid }, { hover: true });
      lastHoverId = fid;
    }

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
    const feature = e.features?.[0];
    if (!feature) return;

    // DESA LEVEL (lowest)
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
      await loadLayer(
        map,
        "LTKL:desa",
        "desa-src",
        "desa-fill",
        `kab='${feature.properties.kab}' AND kec='${feature.properties.kec}' AND des='${feature.properties.des}'`
      );

      return;
    }

    // KECAMATAN LEVEL → Drill into desa
    if ("kec" in feature.properties) {
      updateBreadcrumb("kabupaten", feature.properties.kab);
      updateBreadcrumb("kecamatan", feature.properties.kec);
      updateBreadcrumb("desa", undefined);

      zoomToFeature(map, feature);
      await loadGEEPolygonRaster(map, { kec: feature.properties.kec });

      // Remove only kabupaten layer
      ["kabupaten-fill"].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
        const srcId = id.replace("-fill", "-src");
        if (map.getSource(srcId)) map.removeSource(srcId);
      });

      // Load desa boundaries under this kecamatan
      await loadLayer(
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

      // Load kecamatan layer
      await loadLayer(
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
