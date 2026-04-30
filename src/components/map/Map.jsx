import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Menu } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useMapStore } from '../../store/mapStore.js';
import BreadcrumbsComponent from './BreadCrumbs.jsx';
import { loadGEEPolygonRaster, loadLayer } from '../../store/mapLayerStore.js';
import TimeSeriesSelector from './TimeSelector.jsx';
import MapLegend from './MapLegend.jsx';
import { handleHomeReset, handleBreadcrumbDrill } from '../../utils/mapDrilldown.js';
import { loadLevelLayers, loadDesaLevel } from '../../utils/mapLoadingSetup.js';
import { MAP_CONFIG, LAYER_TYPES, SOURCE_IDS, LAYER_IDS } from '../../config/constants.js';

// Pull config from constants so values don't scatter across many files
const DEFAULT_CENTER = MAP_CONFIG.DEFAULT_CENTER;
const DEFAULT_ZOOM = MAP_CONFIG.DEFAULT_ZOOM;

const Map = ({ onToggleSidebar }) => {
  // ─── REFS ───
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  // ─── STATE ───
  // useShallow so re-render only happens when these field values actually change
  const { breadcrumbs, resetBreadcrumbs, setMap } = useMapStore(
    useShallow((state) => ({
      breadcrumbs: state.breadcrumbs,
      resetBreadcrumbs: state.resetBreadcrumbs,
      setMap: state.setMap,
    })),
  );
  const [isMapReady, setIsMapReady] = useState(false);
  // Track layer loading state so user knows fetch is in progress
  const [isLayersLoading, setIsLayersLoading] = useState(false);

  // ─── HANDLERS ───
  // Home button click: reset map to initial state + clear breadcrumbs
  const handleHome = () =>
    handleHomeReset(mapRef.current, resetBreadcrumbs, DEFAULT_CENTER, DEFAULT_ZOOM);

  // Breadcrumb click to switch level without disturbing parent level state
  const handleBreadcrumbClick = (level) => {
    const { breadcrumbs, updateBreadcrumb } = useMapStore.getState();
    return handleBreadcrumbDrill(mapRef.current, level, breadcrumbs, updateBreadcrumb);
  };

  // ─── MAP INIT ───
  // Initialize map only once to prevent duplicate instances
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Use centralized config so style/zoom changes only need updates in constants
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
        customAttribution: '© LTKL · Auriga Nusantara',
      }),
      'bottom-right',
    );

    mapRef.current = mapInstance;
    setMap(mapInstance); // Store in Zustand so other components can access the same instance

    mapInstance.on('load', () => {
      setIsMapReady(true);
    });

    // Scale control above attribution
    const scaleControl = new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' });
    mapInstance.addControl(scaleControl, 'bottom-right');

    // Cleanup instance on unmount to prevent listener buildup
    return () => {
      try {
        if (mapRef.current) mapRef.current.remove();
      } catch {
        // Ignore cleanup errors
      }
      mapRef.current = null;
      setIsMapReady(false);
      setMap(null);
    };
  }, [setMap]);

  // ─── LOAD LAYERS BY BREADCRUMB ───
  // When breadcrumbs change, layers reload to stay in sync with the active level
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    let isEffectActive = true;
    setIsLayersLoading(true);

    const loadLayersForBreadcrumb = async () => {
      const map = mapRef.current;

      // === DESA LEVEL (deepest) ===
      if (breadcrumbs.des) {
        await loadDesaLevel(map, breadcrumbs);
      }
      // === KECAMATAN LEVEL (mid-level) ===
      else if (breadcrumbs.kec) {
        await loadLevelLayers(map, breadcrumbs, 'kec');
      }
      // === KABUPATEN LEVEL (first drill level) ===
      else if (breadcrumbs.kab) {
        await loadLevelLayers(map, breadcrumbs, 'kab');
      }
      // === DEFAULT (no drill yet) ===
      else {
        // Load initial kabupaten layer for all Indonesia
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

      {/* ── Loading overlay before map is ready ── */}
      {!isMapReady && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gray-100">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-medium tracking-wide">Memuat peta…</p>
        </div>
      )}

      {/* ── Loading indicator when GeoServer/GEE layers are being fetched ── */}
      {isLayersLoading && isMapReady && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-gray-900/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10 shadow-lg pointer-events-none">
          <div className="w-3 h-3 border border-teal-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/80 font-medium">Memuat layer…</span>
        </div>
      )}

      {/* Hamburger button — mobile only, top-right to avoid breadcrumb overlap */}
      {isMapReady && (
        <button
          onClick={onToggleSidebar}
          className="absolute top-4 right-4 z-20 lg:hidden flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-md rounded-lg shadow-lg border border-white/10 px-2.5 py-1.5 hover:bg-gray-900/90 transition-colors cursor-pointer"
          aria-label="Buka menu"
        >
          <Menu size={14} className="text-white/80" />
        </button>
      )}

      {/* Bottom-left controls: legend and year selector */}
      {isMapReady && (
        <div className="absolute bottom-10 left-4 flex flex-col gap-1 items-start select-none">
          <MapLegend />
          <TimeSeriesSelector map={mapRef.current} />
        </div>
      )}

      {/* Breadcrumb navigation */}
      <BreadcrumbsComponent onHome={handleHome} handleBreadcrumbs={handleBreadcrumbClick} />
    </>
  );
};

export default Map;
