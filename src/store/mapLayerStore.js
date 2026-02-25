import maplibregl from "maplibre-gl";
import { useMapStore } from "./mapStore.js";
import { zoomToFeature } from "../utils/mapUtils.js";

export const GEOSERVER_URL = "https://aws.simontini.id/geoserver/ows";
export const TILE_SERVER_URL = "https://gee.simontini.id/gee";

const COLORS = {
  HIGHLIGHT: "#27CBFC",
  DEFAULT: "white",
  TRANSPARENT: "rgba(0,0,0,0)",
};

const LAYERS = {
  GEE_LAYER: "gee-lulc-layer",
  GEE_SOURCE: "gee-lulc",
  HOVER_SUFFIX: "-hover-line",
};

export async function loadGEEPolygonRaster(
  map,
  filters = {}
) {
  try {
    // Ambil tahun dari global store
    const { year } = useMapStore.getState();

    // Merge filters (kab/kec/des + year) - sudah dalam format yang benar
    const query = new URLSearchParams({
      ...filters,
      year: String(year),
    }).toString();

    const cacheKey = `gee_${query}`;
    const store = useMapStore.getState();

  // Periksa cache dulu
  const cached = store.getCacheGEE(cacheKey);
    if (cached) {
      const tileUrl = cached;
      
      // Tambahkan ke map (sama seperti fetch baru)
      if (map.getLayer(LAYERS.GEE_LAYER)) map.removeLayer(LAYERS.GEE_LAYER);
      if (map.getSource(LAYERS.GEE_SOURCE)) map.removeSource(LAYERS.GEE_SOURCE);
      map.addSource(LAYERS.GEE_SOURCE, {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
      });
      
      const allLayers = map.getStyle()?.layers ?? [];
      const beforeId =
        allLayers.find((layer) =>
          ["kabupaten-fill", "kecamatan-fill", "desa-fill"].includes(layer.id)
        )?.id || undefined;

      map.addLayer(
        {
          id: LAYERS.GEE_LAYER,
          type: "raster",
          source: LAYERS.GEE_SOURCE,
          paint: {
            "raster-opacity": 1,
          },
        },
        beforeId
      );
      
      bringHoverLayersToTop(map);
      return;
    }

    // Periksa pending request (agar tidak fetch 2x kalau user click cepat-cepat)
    const pending = store.getPending(cacheKey);
    if (pending) {
      await pending;
      return;
    }

    const url = TILE_SERVER_URL + `${query ? `/lulc?${query}` : "/lulc"}`;

    // Buat promise dan track
    const promise = (async () => {
      const response = await fetch(url);
      const tileUrl = await response.text();

      if (!tileUrl || tileUrl.trim() === "") {
        return;
      }

      // Cache result
      store.setCacheGEE(cacheKey, tileUrl);

      // Hapus layer/source lama sebelum menambahkan yang baru
      if (map.getLayer(LAYERS.GEE_LAYER)) map.removeLayer(LAYERS.GEE_LAYER);
      if (map.getSource(LAYERS.GEE_SOURCE)) map.removeSource(LAYERS.GEE_SOURCE);

      // Tambahkan raster source yang baru
      map.addSource(LAYERS.GEE_SOURCE, {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
      });

      // Tentukan di mana menempatkan raster ini (harus di bawah semuanya)
      const allLayers = map.getStyle()?.layers ?? [];
      const beforeId =
        allLayers.find((layer) =>
          ["kabupaten-fill", "kecamatan-fill", "desa-fill"].includes(layer.id)
        )?.id || undefined;

      // Tambahkan raster layer di posisi yang benar
      map.addLayer(
        {
          id: LAYERS.GEE_LAYER,
          type: "raster",
          source: LAYERS.GEE_SOURCE,
          paint: {
            "raster-opacity": 1,
          },
        },
        beforeId
      );
      
      // Bawa semua hover line layers ke atas
      bringHoverLayersToTop(map);
    })();

    store.setPending(cacheKey, promise);
    await promise;
    store.clearPending(cacheKey);

  } catch (err) {
    console.error("Failed to load GEE LULC raster:", err);
  }
}

// Helper: Remove layer dan source-nya sekaligus
function removeLayerAndSource(map, layerId) {
  // Remove hover line dulu (masih referensi source)
  const hoverLineId = `${layerId}${LAYERS.HOVER_SUFFIX}`;
  if (map.getLayer(hoverLineId)) map.removeLayer(hoverLineId);
  
  // Baru remove main layer
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  
  // Terakhir remove source (tidak ada layer yang pakai lagi)
  const sourceId = layerId.replace("-fill", "-src");
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

// Helper: Bring hover lines ke atas biar terlihat
function bringHoverLayersToTop(map) {
  const layers = map.getStyle()?.layers ?? [];
  const hoverLineIds = layers.map(layer => layer.id).filter(id => id.includes(LAYERS.HOVER_SUFFIX));
  
  // Pindahkan setiap hover line layer ke atas (terakhir ditambahkan = dirender di atas)
  hoverLineIds.forEach(id => {
    try {
      map.moveLayer(id, undefined); // undefined = move to top
    } catch (e) {
      // Layer mungkin tidak ada lagi, skip
    }
  });
}

// Layer loader generik
export const loadLayer = async (
  map,
  layerName,
  sourceId,
  layerId,
  cqlFilter,
  removeLayerIds = []
) => {

  // Bersihkan layer lama
  removeLayerIds.forEach((id) => {
    removeLayerAndSource(map, id);
    const hoverLineId = `${id}${LAYERS.HOVER_SUFFIX}`;
    if (map.getLayer(hoverLineId)) map.removeLayer(hoverLineId);
  });

  // Buat cache key dari layerName + filter
  const cacheKey = `geojson_${layerName}_${cqlFilter || 'all'}`;
  const store = useMapStore.getState();

  let geojson;

  // Periksa cache dulu
  const cached = store.getCacheGeoJSON(cacheKey);
  if (cached) {
    geojson = cached;
  } else {
    // Periksa pending request
    const pending = store.getPending(cacheKey);
    if (pending) {
      geojson = await pending;
    } else {
      // Fetch data dari GeoServer
      const params = new URLSearchParams({
        service: "WFS",
        version: "2.0.0",
        request: "GetFeature",
        typeNames: layerName,
        outputFormat: "application/json",
      });
      if (cqlFilter) params.append("CQL_FILTER", cqlFilter);

      const url = `${GEOSERVER_URL}?${params.toString()}`;

      const promise = (async () => {
        const res = await fetch(url);
        return await res.json();
      })();

      store.setPending(cacheKey, promise);
      geojson = await promise;
      store.clearPending(cacheKey);

      // Cache result
      store.setCacheGeoJSON(cacheKey, geojson);
    }
  }

  // Pastikan setiap feature punya id agar feature-state highlighting berjalan konsisten
  if (Array.isArray(geojson.features)) {
    geojson.features.forEach((feature, index) => {
      if (feature.id === undefined) feature.id = index;
    });
  }

  // Tambah atau update GeoJSON source
  if (map.getSource(sourceId)) {
    (map.getSource(sourceId)).setData(geojson);
    // Jika fill layer dihapus tapi source masih ada (misal saat cleanup), buat ulang
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
            COLORS.HIGHLIGHT,
            COLORS.DEFAULT,
          ],
        },
      });
    }
    // Pastikan hover line layer ada bahkan saat update existing source
    const hoverLineId = `${layerId}${LAYERS.HOVER_SUFFIX}`;
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
            COLORS.HIGHLIGHT,
            COLORS.TRANSPARENT,
          ],
          "line-width": 2,
          "line-opacity": 0.98,
        },
      });
    }
    else {
      const existingHover = map.getLayer(hoverLineId);
      if (existingHover) {
        map.setPaintProperty(hoverLineId, "line-width", 2);
        map.setPaintProperty(hoverLineId, "line-opacity", 0.98);
        map.setPaintProperty(hoverLineId, "line-color", [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          COLORS.HIGHLIGHT,
          COLORS.TRANSPARENT,
        ]);
      }
    }
  } else {
    // Pastikan features punya stable ids agar kita bisa pakai feature-state untuk hover
    map.addSource(sourceId, { type: "geojson", data: geojson, generateId: true });
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
          COLORS.HIGHLIGHT,
          COLORS.DEFAULT
        ],
      },
    });
    // Tambahkan dedicated line layer di atas fill untuk render hover stroke yang lebih tebal
    const hoverLineId = `${layerId}${LAYERS.HOVER_SUFFIX}`;
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
            COLORS.HIGHLIGHT,
            COLORS.TRANSPARENT
          ],
          "line-width": 2,
          "line-opacity": 0.98,
        },
      });
    }
  }

  // Attach logic interaksi SEKALI
  attachLayerInteraction(map, layerId);

  // Bawa hover line layers ke atas
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

  // Popup hover + penekanan border per-feature dengan feature-state
  const sourceId = layerId.replace("-fill", "-src");
  let lastHoverId = null;

  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
    // Bersihkan hover state sebelumnya (hanya jika source masih ada)
    if (lastHoverId !== null && map.getSource(sourceId)) {
      map.setFeatureState({ source: sourceId, id: lastHoverId }, { hover: false });
      lastHoverId = null;
    }
  });

  map.on("mousemove", layerId, (e) => {
    const feature = e.features?.[0];
    if (!feature || !map.getSource(sourceId)) return; // Periksa source ada

    const fid = feature.id;
    // Bersihkan yang sebelumnya (hanya jika source masih ada)
    if (lastHoverId !== null && lastHoverId !== fid) {
      if (map.getSource(sourceId)) {
        map.setFeatureState({ source: sourceId, id: lastHoverId }, { hover: false });
      }
      lastHoverId = null;
    }

    if (fid !== undefined && map.getSource(sourceId)) {
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

    // LEVEL DESA (paling rendah)
    if ("des" in feature.properties) {
      updateBreadcrumb("kabupaten", feature.properties.kab);
      updateBreadcrumb("kecamatan", feature.properties.kec);
      updateBreadcrumb("desa", feature.properties.des);

      // Zoom ke desa dan load raster-nya
      zoomToFeature(map, feature);
      // Load GEE raster untuk desa yang dipilih
      await loadGEEPolygonRaster(map, { des: feature.properties.des });

      // Hapus boundary orang tua (kecamatan & kabupaten)
      ["kecamatan-fill", "kabupaten-fill"].forEach((id) => removeLayerAndSource(map, id));

      // Load dan tampilkan hanya desa yang dipilih
      removeLayerAndSource(map, "desa-fill");

      // Load hanya desa yang dipilih
      await loadLayer(
        map,
        "LTKL:desa",
        "desa-src",
        "desa-fill",
        `kab='${feature.properties.kab}' AND kec='${feature.properties.kec}' AND des='${feature.properties.des}'`
      );

      return;
    }

    // LEVEL KECAMATAN → Drill ke desa
    if ("kec" in feature.properties) {
      updateBreadcrumb("kabupaten", feature.properties.kab);
      updateBreadcrumb("kecamatan", feature.properties.kec);
      updateBreadcrumb("desa", undefined);

      zoomToFeature(map, feature);
      await loadGEEPolygonRaster(map, { kec: feature.properties.kec });

      // Hapus hanya kabupaten layer
      removeLayerAndSource(map, "kabupaten-fill");

      // Load desa boundaries di bawah kecamatan ini
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

    // LEVEL KABUPATEN → Drill ke kecamatan
    if ("kab" in feature.properties) {
      updateBreadcrumb("kabupaten", feature.properties.kab);
      updateBreadcrumb("kecamatan", undefined);
      updateBreadcrumb("desa", undefined);

      // Zoom ke kabupaten dan load raster-nya
      zoomToFeature(map, feature);
      // Load GEE raster untuk kabupaten yang dipilih
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
