import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Menu } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useMapStore } from "../../store/mapStore.js";
import BreadcrumbsComponent from "./BreadCrumbs.jsx";
import { loadGEEPolygonRaster, loadLayer } from "../../store/mapLayerStore.js";
import TimeSeriesSelector from "./TimeSelector.jsx";
import MapLegend from "./MapLegend.jsx";
import { handleHomeReset, handleBreadcrumbDrill } from "../../utils/mapDrilldown.js";
import { loadLevelLayers, loadDesaLevel } from "../../utils/mapLoadingSetup.js";
import { MAP_CONFIG, LAYER_TYPES, SOURCE_IDS, LAYER_IDS } from "../../config/constants.js";

// Ambil config dari constants (untuk avoid hardcoding)
const DEFAULT_CENTER = MAP_CONFIG.DEFAULT_CENTER;
const DEFAULT_ZOOM = MAP_CONFIG.DEFAULT_ZOOM;

const Map = ({ onToggleSidebar }) => {
  // ─── REFS ───
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  // ─── STATE ───
  // useShallow agar re-render hanya saat nilai field ini benar-benar berubah
  const { breadcrumbs, resetBreadcrumbs, setMap } = useMapStore(
    useShallow((state) => ({
      breadcrumbs: state.breadcrumbs,
      resetBreadcrumbs: state.resetBreadcrumbs,
      setMap: state.setMap,
    }))
  );
  const [isMapReady, setIsMapReady] = useState(false);
  // Track apakah layer (GeoServer / GEE) sedang di-fetch setelah map siap
  const [isLayersLoading, setIsLayersLoading] = useState(false);

  // ─── HANDLERS ───
  // Klik tombol "Home": reset map ke initial state + clear breadcrumbs
  const handleHome = () =>
    handleHomeReset(mapRef.current, resetBreadcrumbs, DEFAULT_CENTER, DEFAULT_ZOOM);

  // Click breadcrumb: drill down ke level yang dipilih atau reset level lebih dalam
  const handleBreadcrumbClick = (level) => {
    const { breadcrumbs, updateBreadcrumb } = useMapStore.getState();
    return handleBreadcrumbDrill(mapRef.current, level, breadcrumbs, updateBreadcrumb);
  };

  // ─── INISIALISASI MAP ───
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
      attributionControl: false,
    });

    // Custom compact attribution
    mapInstance.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "© LTKL · Auriga Nusantara",
      }),
      "bottom-right"
    );

    mapRef.current = mapInstance;
    setMap(mapInstance); // Store ke Zustand untuk akses global

    mapInstance.on("load", () => {
      setIsMapReady(true);
    });

    // Scale control di atas attribution
    const scaleControl = new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" });
    mapInstance.addControl(scaleControl, "bottom-right");

    // Cleanup saat component unmount
    return () => {
      try {
        if (mapRef.current) mapRef.current.remove();
      } catch {
        // Abaikan error cleanup
      }
      mapRef.current = null;
      setIsMapReady(false);
      setMap(null);
    };
  }, [setMap]);

  // ─── LOAD LAYERS SESUAI BREADCRUMB ───
  // Jalankan saat: breadcrumbs berubah atau map ready
  // Load layer yang tepat sesuai drill level: kabupaten → kecamatan → desa
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    let isEffectActive = true;
    setIsLayersLoading(true);

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

    loadLayersForBreadcrumb()
      .catch(console.error)
      .finally(() => {
        if (isEffectActive) setIsLayersLoading(false);
      });

    return () => {
      isEffectActive = false;
    };
  }, [breadcrumbs, isMapReady]);

  // ─── RENDER ───
  return (
    <>
      {/* Map container */}
      <div ref={mapContainer} className="h-full w-full" />

      {/* ── LOADING OVERLAY: sebelum map selesai inisialisasi ── */}
      {!isMapReady && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gray-100">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-medium tracking-wide">Memuat peta…</p>
        </div>
      )}

      {/* ── LOADING PILL: saat layer GeoServer / GEE sedang di-fetch ── */}
      {isLayersLoading && isMapReady && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-gray-900/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10 shadow-lg pointer-events-none">
          <div className="w-3 h-3 border border-teal-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/80 font-medium">Memuat layer…</span>
        </div>
      )}

      {/* Tombol hamburger — hanya muncul di mobile, pojok kanan atas agar tidak bentrok breadcrumb */}
      {isMapReady && (
        <button
          onClick={onToggleSidebar}
          className="absolute top-4 right-4 z-20 lg:hidden flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-md rounded-lg shadow-lg border border-white/10 px-2.5 py-1.5 hover:bg-gray-900/90 transition-colors cursor-pointer"
          aria-label="Buka menu"
        >
          <Menu size={14} className="text-white/80" />
        </button>
      )}

      {/* Bottom-left overlay group: Legend pill + Time selector — satu grup posisi */}
      {isMapReady && (
        <div className="absolute bottom-10 left-4 flex flex-col gap-1 items-start select-none">
          <MapLegend />
          <TimeSeriesSelector map={mapRef.current} />
        </div>
      )}

      {/* Breadcrumbs navigation component */}
      <BreadcrumbsComponent onHome={handleHome} handleBreadcrumbs={handleBreadcrumbClick} />
    </>
  );
};

export default Map;
