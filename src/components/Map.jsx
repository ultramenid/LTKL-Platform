import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapStore } from "../store/mapStore.js";
import BreadcrumbsComponent from "./BreadCrumbs.jsx";
import { loadGEEPolygonRaster, loadLayer } from "../store/mapLayerStore.js";
import TimeSeriesSelector from "./TimeSelector.jsx";
import { handleHomeReset, handleBreadcrumbDrill } from "../utils/mapDrilldown.js";
import { loadLevelLayers, loadDesaLevel } from "../utils/mapLoadingSetup.js";
import { MAP_CONFIG, LAYER_TYPES, SOURCE_IDS, LAYER_IDS } from "../config/constants.js";

// Ambil config dari constants (untuk avoid hardcoding)
const DEFAULT_CENTER = MAP_CONFIG.DEFAULT_CENTER;
const DEFAULT_ZOOM = MAP_CONFIG.DEFAULT_ZOOM;

const Map = () => {
  // ─── REFS ───
  const mapContainer = useRef(null); // DOM container untuk map
  const mapRef = useRef(null); // MapLibre GL instance
  
  // ─── STATE ───
  const { breadcrumbs, resetBreadcrumbs, setMap } = useMapStore();
  const [isMapReady, setIsMapReady] = useState(false); // Track kapan map selesai load

  // ─── HANDLERS ───
  // Klik tombol "Home": reset map ke initial state + clear breadcrumbs
  const handleHome = () =>
    handleHomeReset(mapRef.current, resetBreadcrumbs, DEFAULT_CENTER, DEFAULT_ZOOM);

  // Click breadcrumb: drill down ke level yang dipilih atau reset level lebih dalam
  // Contoh: breadcrumb "Bantul" (kab level) → update breadcrumb ke {kab: 'Bantul', ...}
  const handleBreadcrumbClick = (level) => {
    const { breadcrumbs, updateBreadcrumb } = useMapStore.getState();
    return handleBreadcrumbDrill(mapRef.current, level, breadcrumbs, updateBreadcrumb);
  };

  // ─── INITIALIZE MAP ───
  // Jalankan 1x saat component mount untuk inisialisasi MapLibre GL instance
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Create MapLibre GL map instance dengan config dari constants
    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: MAP_CONFIG.MIN_ZOOM,
    });
    
    mapRef.current = mapInstance;
    setMap(mapInstance); // Store ke Zustand untuk akses global

    // Tandai map ready setelah style loaded (agar tidak render layers sebelum siap)
    mapInstance.on("load", () => setIsMapReady(true));

    // Tambah scale control (untuk reference ukuran distance)
    const scaleControl = new maplibregl.ScaleControl({
      maxWidth: 150,
      unit: "metric",
    });
    mapInstance.addControl(scaleControl, "bottom-right");

    // Cleanup saat component unmount
    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.remove();
        }
      } catch (e) {
        // Abaikan error cleanup
      }
      mapRef.current = null;
      setIsMapReady(false);
      setMap(null);
    };
  }, [setMap]);

  // ─── LOAD LAYERS BASED ON BREADCRUMB ───
  // Jalankan saat: breadcrumbs berubah (dari URL sync atau manual drill) atau map ready
  // Load layer yang tepat sesuai drill level: kabupaten → kecamatan → desa
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    
    const loadLayersForBreadcrumb = async () => {
      const map = mapRef.current;

      // === LEVEL DESA (paling dalam) ===
      if (breadcrumbs.des) {
        await loadDesaLevel(map, breadcrumbs);
      } 
      // === LEVEL KECAMATAN (mid-level) ===
      else if (breadcrumbs.kec) {
        await loadLevelLayers(map, breadcrumbs, "kec");
      } 
      // === LEVEL KABUPATEN (top drill level) ===
      else if (breadcrumbs.kab) {
        await loadLevelLayers(map, breadcrumbs, "kab");
      } 
      // === DEFAULT (no drill) ===
      else {
        // Load initial kabupaten layer untuk Indonesia keseluruhan
        await loadLayer(map, LAYER_TYPES.KABUPATEN, SOURCE_IDS.KABUPATEN, LAYER_IDS.KABUPATEN_FILL);
        await loadGEEPolygonRaster(map);
      }
    };

    loadLayersForBreadcrumb();
  }, [breadcrumbs, isMapReady]);

  // ─── RENDER ───
  return (
    <>
      {/* Map container */}
      <div ref={mapContainer} className="h-full w-full" />
      
      {/* Time selector overlay (hanya tampil saat map ready) */}
      {isMapReady && <TimeSeriesSelector map={mapRef.current} />}
      
      {/* Breadcrumbs navigation component */}
      <BreadcrumbsComponent onHome={handleHome} handleBreadcrumbs={handleBreadcrumbClick} />
    </>
  );
};

export default Map;
