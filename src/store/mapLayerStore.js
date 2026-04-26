import maplibregl from "maplibre-gl";
import { useMapStore } from "./mapStore.js";
import { zoomToFeature } from "../utils/mapUtils.js";
import { KABUPATENS } from "../data/kabupatens.js";

// Normalize GeoJSON kab property ke canonical name di KABUPATENS list
// Case-insensitive matching, fallback ke original value jika tidak ketemu (data mungkin tidak konsisten)
const resolveKabName = (rawKab) =>
  KABUPATENS.find((kabupatenRecord) => kabupatenRecord.name.toLowerCase() === String(rawKab).toLowerCase())?.name ?? rawKab;

import {
  API_ENDPOINTS,
  COLORS,
  LAYER_IDS,
  LAYER_TYPES,
  SOURCE_IDS,
  WFS_CONFIG,
} from "../config/constants.js";
import { buildSingleFilter, buildKecamatanFilter, buildDesaFilter } from "../utils/filterBuilder.js";

// Re-export untuk backward compatibility
export const GEOSERVER_URL = API_ENDPOINTS.GEOSERVER;
export const TILE_SERVER_URL = API_ENDPOINTS.TILE_SERVER;

const LAYERS = {
  GEE_LAYER: LAYER_IDS.GEE_LAYER,
  GEE_SOURCE: SOURCE_IDS.GEE,
  HOVER_SUFFIX: "-hover-line",
};

// ─── ABORT CONTROLLER (module-level) ───
// Digunakan untuk cancel semua in-flight fetch requests saat user klik Home
// Diganti (abort + new) setiap kali abortActiveRequests() dipanggil
let activeController = new AbortController();

// Cancel semua in-flight requests (fetch GeoServer + GEE tile server)
// Juga clear pending request dedup agar request baru bisa berjalan fresh
export function abortActiveRequests() {
  activeController.abort();
  activeController = new AbortController();
  // Clear semua pending request references agar tidak await promise yang sudah di-abort
  useMapStore.getState().clearAllPending();
}

// Load GEE LULC raster — cache-first + image probe validasi token, dedup pending requests
export async function loadGEEPolygonRaster(
  map,
  filters = {}
) {
  try {
    const { year } = useMapStore.getState();

    const queryParams = new URLSearchParams({
      ...filters,
      year: String(year),
    }).toString();

    const cacheKey = `gee_${queryParams}`;
    const store = useMapStore.getState();

    // ─── CEK CACHE DULU ───
    const cachedTileUrl = store.getCacheGEE(cacheKey);
    if (cachedTileUrl) {
      // Validasi URL via Image probe — GEE token bisa expire meski TTL belum habis
      // Image() dipakai (bukan fetch HEAD) karena GEE blokir CORS untuk XHR
      const testTileUrl = cachedTileUrl
        .replace("{z}", "4")
        .replace("{x}", "12")
        .replace("{y}", "7");
      const signal = activeController.signal;

      // Abort-aware image probe: resolve true/false, reject hanya saat abort
      const cachedUrlIsValid = await new Promise((resolve, reject) => {
        if (signal.aborted) { reject(new DOMException("Aborted", "AbortError")); return; }

        const img = new Image();
        const onAbort = () => { img.src = ""; reject(new DOMException("Aborted", "AbortError")); };
        signal.addEventListener("abort", onAbort, { once: true });

        img.onload  = () => { signal.removeEventListener("abort", onAbort); resolve(true); };
        img.onerror = () => { signal.removeEventListener("abort", onAbort); resolve(false); };
        img.src = testTileUrl;
      });

      if (cachedUrlIsValid) {
        if (map.getLayer(LAYERS.GEE_LAYER)) map.removeLayer(LAYERS.GEE_LAYER);
        if (map.getSource(LAYERS.GEE_SOURCE)) map.removeSource(LAYERS.GEE_SOURCE);
        map.addSource(LAYERS.GEE_SOURCE, {
          type: "raster",
          tiles: [cachedTileUrl],
          tileSize: 256,
        });

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
            paint: { "raster-opacity": 1 },
          },
          layerIdToPlaceBelow
        );

        // Pastikan hover line layers ada di atas (visible)
        bringHoverLayersToTop(map);
        return;
      }

      // Token GEE expired — hapus cache lama, fetch ulang
      store.clearCacheGEE(cacheKey);
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

    const fetchPromise = (async () => {
      const response = await fetch(tileServerUrl, { signal: activeController.signal });
      const geeRasterTileUrl = await response.text();

      if (!geeRasterTileUrl || geeRasterTileUrl.trim() === "") {
        return;
      }

      store.setCacheGEE(cacheKey, geeRasterTileUrl);

      if (map.getLayer(LAYERS.GEE_LAYER)) map.removeLayer(LAYERS.GEE_LAYER);
      if (map.getSource(LAYERS.GEE_SOURCE)) map.removeSource(LAYERS.GEE_SOURCE);

      map.addSource(LAYERS.GEE_SOURCE, {
        type: "raster",
        tiles: [geeRasterTileUrl],
        tileSize: 256,
      });

      // Tempatkan GEE raster di bawah administrative boundaries
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
      
      // Pastikan hover line layers ada di atas
      bringHoverLayersToTop(map);
    })();

    store.setPending(cacheKey, fetchPromise);
    await fetchPromise;
    store.clearPending(cacheKey);

  } catch (err) {
    if (err.name === "AbortError") return; // Dibatalkan saat Home di-klik, bukan error
    console.error("Failed to load GEE LULC raster:", err);
  }
}

// Hapus semua layers yang pakai suatu source, lalu hapus source-nya
// Cari sourceId dari map style (bukan string derivation) agar zoom layers juga tercakup
export function removeLayerAndSource(map, layerId) {
  if (!map || !map.getStyle) return;

  const allLayers = map.getStyle()?.layers ?? [];

  // Cari source yang benar-benar dipakai layer ini
  const layerDef = allLayers.find(layerItem => layerItem.id === layerId);
  let sourceId = layerDef?.source;
  
  // Jika layer tidak ditemukan, coba derive dari hover-line (bisa jadi fill sudah terhapus)
  if (!sourceId) {
    const hoverLineId = `${layerId}${LAYERS.HOVER_SUFFIX}`;
    const hoverLineDef = allLayers.find(layerItem => layerItem.id === hoverLineId);
    sourceId = hoverLineDef?.source;
  }
  
  // Terakhir, gunakan pattern derivation sebagai fallback
  if (!sourceId) {
    sourceId = layerId.replace("-fill", "-src").replace(LAYERS.HOVER_SUFFIX, "-src");
  }

  // Hapus SEMUA layers yang pakai source ini (fill + hover-line + layer lainnya)
  allLayers.filter(layerItem => layerItem.source === sourceId).forEach(layerItem => {
    try { if (map.getLayer(layerItem.id)) map.removeLayer(layerItem.id); } catch { /* skip */ }
  });

  // Setelah semua layers dihapus, baru hapus source
  try { if (map.getSource(sourceId)) map.removeSource(sourceId); } catch { /* skip */ }
}

// Pindahkan semua hover line layers ke atas agar terlihat di atas admin boundaries
function bringHoverLayersToTop(map) {
  const allLayers = map.getStyle()?.layers ?? [];
  const hoverLineIds = allLayers.map(layer => layer.id).filter(id => id.includes(LAYERS.HOVER_SUFFIX));
  
  // Pindahkan setiap hover line ke atas (rendering order: undefined = top)
  hoverLineIds.forEach(layerItemId => {
    try {
      map.moveLayer(layerItemId, undefined);
    } catch {
      // Layer mungkin tidak ada lagi (dihapus), skip saja
    }
  });
}

// Load GeoJSON layer dari GeoServer (cache-first, dedup pending requests)
// removeLayerIds: layer yang harus dihapus sebelum load
export const loadLayer = async (
  map,
  layerName,
  sourceId,
  layerId,
  cqlFilter,
  removeLayerIds = []
) => {
  // ─── CLEANUP LAYER LAMA ───
  // removeLayerAndSource sudah handle hover-line + fill layer sekaligus
  removeLayerIds.forEach((id) => removeLayerAndSource(map, id));

  // ─── CEK CACHE ───
  const cacheKey = `geojson_${layerName}_${cqlFilter || 'all'}`;
  const store = useMapStore.getState();

  let geoJsonData;

  try {
    const cachedGeoJson = store.getCacheGeoJSON(cacheKey);
    if (cachedGeoJson) {
      geoJsonData = cachedGeoJson;
    } else {
      // Dedup: tunggu pending request yang sama jika ada
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
          const response = await fetch(geoserverUrl, { signal: activeController.signal });
          return await response.json();
        })();

        store.setPending(cacheKey, fetchPromise);
        geoJsonData = await fetchPromise;
        store.clearPending(cacheKey);
        store.setCacheGeoJSON(cacheKey, geoJsonData);
      }
    }
  } catch (err) {
    if (err.name === "AbortError") return; // Dibatalkan saat Home di-klik, bukan error
    console.error(`Failed to load layer ${layerId}:`, err);
    return;
  }

  // Guard: jika geoJsonData kosong/null, exit
  if (!geoJsonData || !Array.isArray(geoJsonData.features)) {
    console.warn(`No GeoJSON features loaded for ${layerId}`);
    return;
  }

  // ─── ENSURE FEATURE IDS ───
  // Setiap feature harus punya id agar feature-state (hover highlighting) berjalan konsisten
  geoJsonData.features.forEach((feature, index) => {
    if (feature.id === undefined) feature.id = index;
  });

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
    // Hapus layer lama dulu jika masih ada (bisa terjadi saat source sudah di-remove tapi layer belum)
    if (map.getLayer(`${layerId}${LAYERS.HOVER_SUFFIX}`)) map.removeLayer(`${layerId}${LAYERS.HOVER_SUFFIX}`);
    if (map.getLayer(layerId)) map.removeLayer(layerId);

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
  // Attach interaksi hover + click (cegah duplikat jika dipanggil >1 kali)
  attachLayerInteraction(map, layerId);

  // Pastikan hover lines ada di atas (visible)
  bringHoverLayersToTop(map);

  return geoJsonData;
};

// Attach interaksi hover & click ke layer (highlight, popup nama, drilldown)
function attachLayerInteraction(map, layerId) {
  const { updateBreadcrumb } = useMapStore.getState();
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

  // Cegah binding handler 2x ke layer yang sama
  const internalMap = map;
  if (!internalMap._attachedLayers) internalMap._attachedLayers = new Set();
  if (internalMap._attachedLayers.has(layerId)) return;
  internalMap._attachedLayers.add(layerId);

  // Ambil source ID dari layer ID (pola: "kabupaten-fill" → "kabupaten-src")
  const sourceId = layerId.replace("-fill", "-src");
  let lastHoverFeatureId = null; // Simpan feature yang sedang di-hover

  // ─── MOUSE ENTER: Ubah cursor ke pointer ───
  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = "pointer";
  });

  // ─── MOUSE LEAVE: Reset cursor & sembunyikan popup ───
  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
    // Bersihkan hover state feature sebelumnya
    if (lastHoverFeatureId !== null && map.getSource(sourceId)) {
      map.setFeatureState({ source: sourceId, id: lastHoverFeatureId }, { hover: false });
      lastHoverFeatureId = null;
    }
  });

  // ─── MOUSE MOVE: Tampilkan popup & highlight feature ───
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

    // Tampilkan nama area di popup (prioritas: desa > kecamatan > kabupaten)
    const areaName =
      hoveredFeature.properties?.des ??
      hoveredFeature.properties?.kec ??
      hoveredFeature.properties?.kab ??
      "Unknown";
    
    if (areaName && areaName !== "Unknown") {
      popup.setLngLat(e.lngLat).setHTML(`<strong>${areaName}</strong>`).addTo(map);
    }
  });

  // ─── CLICK HANDLER: Drill-down ke level berikutnya ───
  map.on("click", layerId, async (e) => {
    const clickedFeature = e.features?.[0];
    if (!clickedFeature?.properties) return;

    const { kab, kec, des } = clickedFeature.properties;

    // === LEVEL DESA (paling dalam) ===
    if (des) {
      updateBreadcrumb("kabupaten", kab);
      updateBreadcrumb("kecamatan", kec);
      updateBreadcrumb("desa", des);
      useMapStore.getState().setSelectedKab(resolveKabName(kab));

      // Zoom ke boundary desa yang dipilih
      zoomToFeature(map, clickedFeature);
      
      // Load GEE coverage untuk desa itu
      await loadGEEPolygonRaster(map, { des });

      // Hapus boundary orang tua (kecamatan & kabupaten tidak perlu lagi)
      [LAYER_IDS.KECAMATAN_FILL, LAYER_IDS.KABUPATEN_FILL].forEach((id) => removeLayerAndSource(map, id));

      // Hapus layer desa lama dan load ulang dengan filter 3-level
      removeLayerAndSource(map, LAYER_IDS.DESA_FILL);
      await loadLayer(
        map,
        LAYER_TYPES.DESA,
        SOURCE_IDS.DESA,
        LAYER_IDS.DESA_FILL,
        buildDesaFilter({ kab, kec, des })
      );

      return;
    }

    // === LEVEL KECAMATAN (mid-level) ===
    if (kec) {
      updateBreadcrumb("kabupaten", kab);
      updateBreadcrumb("kecamatan", kec);
      updateBreadcrumb("desa", undefined); // Reset desa saat navigate ke kecamatan baru
      useMapStore.getState().setSelectedKab(resolveKabName(kab));

      // Zoom ke boundary kecamatan yang dipilih
      zoomToFeature(map, clickedFeature);
      
      // Load GEE coverage untuk kecamatan itu
      await loadGEEPolygonRaster(map, { kec });

      // Hapus kabupaten layer (tidak diperlukan saat sudah di-drill ke kecamatan)
      removeLayerAndSource(map, LAYER_IDS.KABUPATEN_FILL);

      // Load desa boundaries di dalam kecamatan ini
      await loadLayer(
        map,
        LAYER_TYPES.DESA,
        SOURCE_IDS.DESA,
        LAYER_IDS.DESA_FILL,
        buildKecamatanFilter({ kab, kec }),
        [LAYER_IDS.KECAMATAN_FILL]
      );

      return;
    }

    // === LEVEL KABUPATEN (top-level) ===
    if (kab) {
      updateBreadcrumb("kabupaten", kab);
      updateBreadcrumb("kecamatan", undefined);
      updateBreadcrumb("desa", undefined);
      useMapStore.getState().setSelectedKab(resolveKabName(kab));

      // Zoom ke boundary kabupaten yang dipilih
      zoomToFeature(map, clickedFeature);
      
      // Load GEE coverage untuk kabupaten itu
      await loadGEEPolygonRaster(map, { kab });

      // Load kecamatan boundaries di dalam kabupaten ini (replace kabupaten layer)
      await loadLayer(
        map,
        LAYER_TYPES.KECAMATAN,
        SOURCE_IDS.KECAMATAN,
        LAYER_IDS.KECAMATAN_FILL,
        buildSingleFilter('kab', kab),
        [LAYER_IDS.KABUPATEN_FILL]
      );
    }
  });
}

// ─── LOAD LAYER DENGAN CUSTOM CALLBACK (untuk peta terisolasi) ───────────────
// Sama persis dengan loadLayer dalam hal WFS fetch, GeoJSON cache, dan interaksi
// hover/popup — satu-satunya perbedaan: klik memanggil onClickCallback(feature)
// sehingga state tetap lokal di komponen, tidak bocor ke global Zustand store.
// Mengembalikan { geojson, cleanup } karena peta profil me-recreate layer saat
// drill level berubah, dan cleanup() mencegah event listener menumpuk.
export const loadLayerWithCallback = async (
  map,
  layerName,
  sourceId,
  layerId,
  cqlFilter,
  onClickCallback
) => {
  // ─── WFS FETCH + CACHE ───────────────────────────────────────────────────────
  // cacheKey identik dengan loadLayer agar kedua peta berbagi cache yang sama
  const cacheKey = `geojson_${layerName}_${cqlFilter || 'all'}`;
  const store = useMapStore.getState();
  let geoJsonData;

  try {
    const cachedGeoJson = store.getCacheGeoJSON(cacheKey);
    if (cachedGeoJson) {
      geoJsonData = cachedGeoJson;
    } else {
      const pendingRequest = store.getPending(cacheKey);
      if (pendingRequest) {
        geoJsonData = await pendingRequest;
      } else {
        const wfsParams = new URLSearchParams({
          service: WFS_CONFIG.SERVICE, version: WFS_CONFIG.VERSION,
          request: WFS_CONFIG.REQUEST, typeNames: layerName,
          outputFormat: WFS_CONFIG.OUTPUT_FORMAT,
        });
        if (cqlFilter) wfsParams.append('CQL_FILTER', cqlFilter);

        // activeController dipakai agar abortActiveRequests() dari komponen
        // dapat membatalkan fetch ini (sesuai Rule A — tidak buat controller baru)
        const fetchPromise = (async () => {
          const wfsResponse = await fetch(`${GEOSERVER_URL}?${wfsParams}`, { signal: activeController.signal });
          return await wfsResponse.json();
        })();

        store.setPending(cacheKey, fetchPromise);
        geoJsonData = await fetchPromise;
        store.clearPending(cacheKey);
        store.setCacheGeoJSON(cacheKey, geoJsonData);
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return { geojson: null, cleanup: null };
    console.error(`loadLayerWithCallback: gagal memuat ${layerId}:`, err);
    return { geojson: null, cleanup: null };
  }

  if (!geoJsonData?.features?.length) return { geojson: null, cleanup: null };
  geoJsonData.features.forEach((feature, index) => { if (feature.id === undefined) feature.id = index; });

  // ─── ADD SOURCE + LAYER ──────────────────────────────────────────────────────
  const hoverLineId = `${layerId}${LAYERS.HOVER_SUFFIX}`;
  // Hapus layer lama sebelum menambah yang baru (urutan: layer dulu, baru source)
  [hoverLineId, layerId].forEach((layerIdToRemove) => {
    try { if (map.getLayer(layerIdToRemove)) map.removeLayer(layerIdToRemove); } catch { /* skip */ }
  });
  try { if (map.getSource(sourceId)) map.removeSource(sourceId); } catch { /* skip */ }

  map.addSource(sourceId, { type: 'geojson', data: geoJsonData, generateId: true });
  map.addLayer({
    id: layerId, type: 'fill', source: sourceId,
    paint: {
      'fill-color': 'transparent', 'fill-opacity': 0.5,
      'fill-outline-color': ['case', ['boolean', ['feature-state', 'hover'], false], COLORS.HIGHLIGHT, COLORS.DEFAULT],
    },
  });
  map.addLayer({
    id: hoverLineId, type: 'line', source: sourceId,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], COLORS.HIGHLIGHT, COLORS.TRANSPARENT],
      'line-width': 2, 'line-opacity': 0.98,
    },
  });
  bringHoverLayersToTop(map);

  // ─── INTERAKSI HOVER + CLICK ─────────────────────────────────────────────────
  const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
  let lastHoveredFeatureId = null;

  const clearHoverState = () => {
    if (lastHoveredFeatureId !== null) {
      try { map.setFeatureState({ source: sourceId, id: lastHoveredFeatureId }, { hover: false }); } catch { /* skip */ }
      lastHoveredFeatureId = null;
    }
  };

  const onMouseEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
  const onMouseLeave = () => { map.getCanvas().style.cursor = ''; popup.remove(); clearHoverState(); };

  const onMouseMove = (e) => {
    const hoveredFeature = e.features?.[0];
    if (!hoveredFeature || !map.getSource(sourceId)) return;
    const hoveredFeatureId = hoveredFeature.id;
    if (lastHoveredFeatureId !== null && lastHoveredFeatureId !== hoveredFeatureId) clearHoverState();
    if (hoveredFeatureId !== undefined) {
      try { map.setFeatureState({ source: sourceId, id: hoveredFeatureId }, { hover: true }); } catch { /* skip */ }
      lastHoveredFeatureId = hoveredFeatureId;
    }
    const areaName = hoveredFeature.properties?.des ?? hoveredFeature.properties?.kec ?? hoveredFeature.properties?.kab ?? 'Unknown';
    if (areaName !== 'Unknown') popup.setLngLat(e.lngLat).setHTML(`<strong>${areaName}</strong>`).addTo(map);
  };

  const onClickHandler = (e) => {
    const clickedFeature = e.features?.[0];
    // Delegate ke local state — tidak menyentuh global store
    if (clickedFeature?.properties) onClickCallback(clickedFeature);
  };

  map.on('mouseenter', layerId, onMouseEnter);
  map.on('mouseleave', layerId, onMouseLeave);
  map.on('mousemove',  layerId, onMouseMove);
  map.on('click',      layerId, onClickHandler);

  // cleanup dipanggil caller sebelum layer di-recreate agar listener tidak menumpuk
  const cleanup = () => {
    try {
      map.off('mouseenter', layerId, onMouseEnter);
      map.off('mouseleave', layerId, onMouseLeave);
      map.off('mousemove',  layerId, onMouseMove);
      map.off('click',      layerId, onClickHandler);
    } catch { /* map mungkin sudah di-remove saat komponen unmount */ }
    popup.remove();
    clearHoverState();
  };

  return { geojson: geoJsonData, cleanup };
};
