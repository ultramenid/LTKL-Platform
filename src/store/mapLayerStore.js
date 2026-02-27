import maplibregl from "maplibre-gl";
import { useMapStore } from "./mapStore.js";
import { zoomToFeature } from "../utils/mapUtils.js";
import {
  API_ENDPOINTS,
  COLORS,
  LAYER_IDS,
  LAYER_TYPES,
  SOURCE_IDS,
  WFS_CONFIG,
} from "../config/constants.js";

// Re-export untuk backward compatibility
export const GEOSERVER_URL = API_ENDPOINTS.GEOSERVER;
export const TILE_SERVER_URL = API_ENDPOINTS.TILE_SERVER;

const LAYERS = {
  GEE_LAYER: LAYER_IDS.GEE_LAYER,
  GEE_SOURCE: SOURCE_IDS.GEE,
  HOVER_SUFFIX: "-hover-line",
};

// Load raster coverage dari Google Earth Engine (LULC data)
// Parameters: filters = {kab, kec, des, year} untuk filter coverage area
// Menggunakan cache untuk performance, dedup pending requests agar tidak fetch 2x
export async function loadGEEPolygonRaster(
  map,
  filters = {}
) {
  try {
    // Get tahun dari Zustand store (state global)
    const { year } = useMapStore.getState();

    // Merge filters (tambahan filter + tahun) → format URL query param
    const queryParams = new URLSearchParams({
      ...filters,
      year: String(year),
    }).toString();

    const cacheKey = `gee_${queryParams}`;
    const store = useMapStore.getState();

    // ─── CEK CACHE DULU ───
    const cachedTileUrl = store.getCacheGEE(cacheKey);
    if (cachedTileUrl) {
      // Data sudah pernah diminta, gunakan dari cache
      // Tambahkan ke map dengan source & layer yang sama seperti fetch baru
      if (map.getLayer(LAYERS.GEE_LAYER)) map.removeLayer(LAYERS.GEE_LAYER);
      if (map.getSource(LAYERS.GEE_SOURCE)) map.removeSource(LAYERS.GEE_SOURCE);
      map.addSource(LAYERS.GEE_SOURCE, {
        type: "raster",
        tiles: [cachedTileUrl],
        tileSize: 256,
      });
      
      // Find layer yang seharusnya berada dibawah (kabupaten, kecamatan, atau desa)
      const allLayers = map.getStyle()?.layers ?? [];
      const layerIdToPlaceBelow =
        allLayers.find((layer) =>
          [LAYER_IDS.KABUPATEN_FILL, LAYER_IDS.KECAMATAN_FILL, LAYER_IDS.DESA_FILL].includes(layer.id)
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
        layerIdToPlaceBelow
      );
      
      // Pastikan hover line layers ada di atas (visible)
      bringHoverLayersToTop(map);
      return;
    }

    // ─── CEK PENDING REQUEST (avoid duplicate requests) ───
    const pendingRequest = store.getPending(cacheKey);
    if (pendingRequest) {
      // Request sudah diminta orang lain, tunggu saja
      await pendingRequest;
      return;
    }

    // ─── FETCH DATA DARI TILE SERVER ───
    const tileServerUrl = TILE_SERVER_URL + `${queryParams ? `/lulc?${queryParams}` : "/lulc"}`;

    // Buat promise dan track di store (agar request lain bisa tunggu)
    const fetchPromise = (async () => {
      const response = await fetch(tileServerUrl);
      const geeRasterTileUrl = await response.text();

      if (!geeRasterTileUrl || geeRasterTileUrl.trim() === "") {
        return;
      }

      // Cache result untuk next time
      store.setCacheGEE(cacheKey, geeRasterTileUrl);

      // Remove layer/source lama sebelum menambahkan yang baru
      if (map.getLayer(LAYERS.GEE_LAYER)) map.removeLayer(LAYERS.GEE_LAYER);
      if (map.getSource(LAYERS.GEE_SOURCE)) map.removeSource(LAYERS.GEE_SOURCE);

      // Tambahkan raster source dengan tile URL dari server
      map.addSource(LAYERS.GEE_SOURCE, {
        type: "raster",
        tiles: [geeRasterTileUrl],
        tileSize: 256,
      });

      // Find layer yang seharusnya berada dibawah GEE raster
      const allLayers = map.getStyle()?.layers ?? [];
      const layerIdToPlaceBelow =
        allLayers.find((layer) =>
          [LAYER_IDS.KABUPATEN_FILL, LAYER_IDS.KECAMATAN_FILL, LAYER_IDS.DESA_FILL].includes(layer.id)
        )?.id || undefined;

      // Tambahkan raster layer di posisi yang benar (dibawah administrative boundaries)
      map.addLayer(
        {
          id: LAYERS.GEE_LAYER,
          type: "raster",
          source: LAYERS.GEE_SOURCE,
          paint: {
            "raster-opacity": 1,
          },
        },
        layerIdToPlaceBelow
      );
      
      // Pastikan hover line layers ada di atas
      bringHoverLayersToTop(map);
    })();

    store.setPending(cacheKey, fetchPromise);
    await fetchPromise;
    store.clearPending(cacheKey);

  } catch (err) {
    console.error("Failed to load GEE LULC raster:", err);
  }
}

// Helper: Hapus layer dan source-nya secara bersamaan
// Important: hapus hover line dulu (masih reference ke source), baru layer, terakhir source
export function removeLayerAndSource(map, layerId) {
  // Hapus hover line dulu (masih pakai reference ke source)
  const hoverLineId = `${layerId}${LAYERS.HOVER_SUFFIX}`;
  if (map.getLayer(hoverLineId)) map.removeLayer(hoverLineId);
  
  // Hapus main layer
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  
  // Terakhir hapus source (setelah semua layer yang pakai sudah dihapus)
  const sourceId = layerId.replace("-fill", "-src");
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

// Helper: Pindahkan semua hover line layers ke atas supaya terlihat
// Hover lines harus di atas admin boundaries agar visible saat user hover
function bringHoverLayersToTop(map) {
  const allLayers = map.getStyle()?.layers ?? [];
  const hoverLineIds = allLayers.map(layer => layer.id).filter(id => id.includes(LAYERS.HOVER_SUFFIX));
  
  // Pindahkan setiap hover line ke atas (rendering order: undefined = top)
  hoverLineIds.forEach(id => {
    try {
      map.moveLayer(id, undefined); // undefined = move to top
    } catch (e) {
      // Layer mungkin tidak ada lagi (dihapus), skip saja
    }
  });
}

// Load GeoJSON layer dari GeoServer (dengan cache & dedup pending requests)
// layerName: nama layer di GeoServer (e.g., "kabupatens", "kecamatan", "desa")
// cqlFilter: CQL filter untuk query (e.g., "kab='Bantul'")
// removeLayerIds: layer IDs yang harus dihapus dulu (untuk cleanup)
export const loadLayer = async (
  map,
  layerName,
  sourceId,
  layerId,
  cqlFilter,
  removeLayerIds = []
) => {
  // ─── CLEANUP LAYER LAMA ───
  removeLayerIds.forEach((id) => {
    removeLayerAndSource(map, id);
    const hoverLineId = `${id}${LAYERS.HOVER_SUFFIX}`;
    if (map.getLayer(hoverLineId)) map.removeLayer(hoverLineId);
  });

  // ─── CEK CACHE ───
  // Buat cache key dari layerName + filter (agar berbeda layer = berbeda cache)
  const cacheKey = `geojson_${layerName}_${cqlFilter || 'all'}`;
  const store = useMapStore.getState();

  let geoJsonData;

  // Coba ambil dari cache dulu
  const cachedGeoJson = store.getCacheGeoJSON(cacheKey);
  if (cachedGeoJson) {
    geoJsonData = cachedGeoJson;
  } else {
    // Cek pending request (jangan fetch 2x kalau ada request yang sedang berlangsung)
    const pendingRequest = store.getPending(cacheKey);
    if (pendingRequest) {
      geoJsonData = await pendingRequest;
    } else {
      // ─── FETCH DARI GEOSERVER ───
      const wfsParams = new URLSearchParams({
        service: WFS_CONFIG.SERVICE,
        version: WFS_CONFIG.VERSION,
        request: WFS_CONFIG.REQUEST,
        typeNames: layerName,
        outputFormat: WFS_CONFIG.OUTPUT_FORMAT,
      });
      if (cqlFilter) wfsParams.append("CQL_FILTER", cqlFilter);

      const geoserverUrl = `${GEOSERVER_URL}?${wfsParams.toString()}`;

      const fetchPromise = (async () => {
        const response = await fetch(geoserverUrl);
        return await response.json();
      })();

      // Track pending request agar request lain bisa tunggu
      store.setPending(cacheKey, fetchPromise);
      geoJsonData = await fetchPromise;
      store.clearPending(cacheKey);

      // Cache result untuk performance
      store.setCacheGeoJSON(cacheKey, geoJsonData);
    }
  }

  // ─── ENSURE FEATURE IDS ───
  // Setiap feature harus punya id agar feature-state (hover highlighting) berjalan konsisten
  if (Array.isArray(geoJsonData.features)) {
    geoJsonData.features.forEach((feature, index) => {
      if (feature.id === undefined) feature.id = index;
    });
  }

  // ─── ADD/UPDATE SOURCE & LAYER ───
  if (map.getSource(sourceId)) {
    // Source sudah ada: update data saja
    (map.getSource(sourceId)).setData(geoJsonData);
    
    // Jika fill layer dihapus tapi source masih ada, buat ulang layer
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
    
    // Pastikan hover line layer ada (create atau update)
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
    } else {
      // Update hover line properties
      const existingHoverLine = map.getLayer(hoverLineId);
      if (existingHoverLine) {
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
    // Source tidak ada: create source + layers baru
    map.addSource(sourceId, { type: "geojson", data: geoJsonData, generateId: true });
    
    // Create fill layer
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
    
    // Create hover line layer (di atas fill layer untuk render tebal saat hover)
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

  // ─── ATTACH INTERACTIONS ───
  // Attach hover + click handlers (prevent duplicate if called multiple times)
  attachLayerInteraction(map, layerId);

  // Pastikan hover lines ada di atas (visible)
  bringHoverLayersToTop(map);

  return geoJsonData;
};

// Attach mouse hover & click interactions ke layer
// Termasuk: cursor change, popup hint, drilldown logic
function attachLayerInteraction(map, layerId) {
  const { updateBreadcrumb } = useMapStore.getState();
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

  // Prevent binding handler 2x ke layer yang sama
  const internalMap = map;
  if (!internalMap._attachedLayers) internalMap._attachedLayers = new Set();
  if (internalMap._attachedLayers.has(layerId)) return;
  internalMap._attachedLayers.add(layerId);

  // Get source ID dari layer ID (pattern: "kabupaten-fill" → "kabupaten-src")
  const sourceId = layerId.replace("-fill", "-src");
  let lastHoverFeatureId = null; // Track feature yang sedang di-hover

  // ─── MOUSE ENTER: Change cursor to pointer ───
  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = "pointer";
  });

  // ─── MOUSE LEAVE: Reset cursor & hide popup ───
  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
    // Bersihkan hover state feature sebelumnya
    if (lastHoverFeatureId !== null && map.getSource(sourceId)) {
      map.setFeatureState({ source: sourceId, id: lastHoverFeatureId }, { hover: false });
      lastHoverFeatureId = null;
    }
  });

  // ─── MOUSE MOVE: Show popup & highlight feature ───
  map.on("mousemove", layerId, (e) => {
    const hoveredFeature = e.features?.[0];
    if (!hoveredFeature || !map.getSource(sourceId)) return;

    const hoveredFeatureId = hoveredFeature.id;
    
    // Bersihkan hover state dari feature sebelumnya
    if (lastHoverFeatureId !== null && lastHoverFeatureId !== hoveredFeatureId) {
      if (map.getSource(sourceId)) {
        map.setFeatureState({ source: sourceId, id: lastHoverFeatureId }, { hover: false });
      }
      lastHoverFeatureId = null;
    }

    // Set hover state ke feature yang baru
    if (hoveredFeatureId !== undefined && map.getSource(sourceId)) {
      map.setFeatureState({ source: sourceId, id: hoveredFeatureId }, { hover: true });
      lastHoverFeatureId = hoveredFeatureId;
    }

    // Display nama area di popup (prioritas: desa > kecamatan > kabupaten)
    const areaName =
      "des" in hoveredFeature.properties
        ? hoveredFeature.properties.des
        : "kec" in hoveredFeature.properties
        ? hoveredFeature.properties.kec
        : hoveredFeature.properties.kab;
    popup.setLngLat(e.lngLat).setHTML(`<strong>${areaName}</strong>`).addTo(map);
  });

  // ─── CLICK HANDLER: Drilldown to next level ───
  map.on("click", layerId, async (e) => {
    const clickedFeature = e.features?.[0];
    if (!clickedFeature) return;

    // === LEVEL DESA (paling dalam) ===
    if ("des" in clickedFeature.properties) {
      // Update breadcrumb state di Zustand store
      updateBreadcrumb("kabupaten", clickedFeature.properties.kab);
      updateBreadcrumb("kecamatan", clickedFeature.properties.kec);
      updateBreadcrumb("desa", clickedFeature.properties.des);

      // Zoom ke boundary desa yang dipilih
      zoomToFeature(map, clickedFeature);
      
      // Load GEE coverage untuk desa itu
      await loadGEEPolygonRaster(map, { des: clickedFeature.properties.des });

      // Hapus boundary orang tua (kecamatan & kabupaten tidak perlu lagi)
      [LAYER_IDS.KECAMATAN_FILL, LAYER_IDS.KABUPATEN_FILL].forEach((id) => removeLayerAndSource(map, id));

      // Remove old desa layer dan load ulang dengan filter presisi 3-level
      removeLayerAndSource(map, LAYER_IDS.DESA_FILL);
      await loadLayer(
        map,
        LAYER_TYPES.DESA,
        SOURCE_IDS.DESA,
        LAYER_IDS.DESA_FILL,
        `kab='${clickedFeature.properties.kab}' AND kec='${clickedFeature.properties.kec}' AND des='${clickedFeature.properties.des}'`
      );

      return;
    }

    // === LEVEL KECAMATAN (mid-level) ===
    if ("kec" in clickedFeature.properties) {
      // Update breadcrumb state
      updateBreadcrumb("kabupaten", clickedFeature.properties.kab);
      updateBreadcrumb("kecamatan", clickedFeature.properties.kec);
      updateBreadcrumb("desa", undefined); // Reset desa saat navigate ke kecamatan baru

      // Zoom ke boundary kecamatan yang dipilih
      zoomToFeature(map, clickedFeature);
      
      // Load GEE coverage untuk kecamatan itu
      await loadGEEPolygonRaster(map, { kec: clickedFeature.properties.kec });

      // Hapus kabupaten layer (tidak diperlukan saat sudah di-drill ke kecamatan)
      removeLayerAndSource(map, LAYER_IDS.KABUPATEN_FILL);

      // Load desa boundaries di dalam kecamatan ini
      await loadLayer(
        map,
        LAYER_TYPES.DESA,
        SOURCE_IDS.DESA,
        LAYER_IDS.DESA_FILL,
        `kab='${clickedFeature.properties.kab}' AND kec='${clickedFeature.properties.kec}'`,
        [LAYER_IDS.KECAMATAN_FILL]
      );

      return;
    }

    // === LEVEL KABUPATEN (top-level) ===
    if ("kab" in clickedFeature.properties) {
      // Update breadcrumb state (reset kecamatan & desa)
      updateBreadcrumb("kabupaten", clickedFeature.properties.kab);
      updateBreadcrumb("kecamatan", undefined);
      updateBreadcrumb("desa", undefined);

      // Zoom ke boundary kabupaten yang dipilih
      zoomToFeature(map, clickedFeature);
      
      // Load GEE coverage untuk kabupaten itu
      await loadGEEPolygonRaster(map, { kab: clickedFeature.properties.kab });

      // Load kecamatan boundaries di dalam kabupaten ini (replace kabupaten layer)
      await loadLayer(
        map,
        LAYER_TYPES.KECAMATAN,
        SOURCE_IDS.KECAMATAN,
        LAYER_IDS.KECAMATAN_FILL,
        `kab='${clickedFeature.properties.kab}'`,
        [LAYER_IDS.KABUPATEN_FILL]
      );
    }
  });
}
