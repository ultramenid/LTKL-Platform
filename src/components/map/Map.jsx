import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Menu } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useMapStore } from '../../store/mapStore.js';
import BreadcrumbsComponent from './BreadCrumbs.jsx';
import { abortActiveRequests } from '../../store/mapLayerStore.js';
import TimeSeriesSelector from './TimeSelector.jsx';
import MapLegend from './MapLegend.jsx';
import { handleHomeReset, handleBreadcrumbDrill } from '../../utils/mapDrilldown.js';
import { transitionMainMap } from '../../utils/mapTransitionController.js';
import { MAP_CONFIG } from '../../config/constants.js';

const DEFAULT_CENTER = MAP_CONFIG.DEFAULT_CENTER;
const DEFAULT_ZOOM = MAP_CONFIG.DEFAULT_ZOOM;

const Map = ({ onToggleSidebar }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const { breadcrumbs, resetBreadcrumbs, setMap, year } = useMapStore(
    useShallow((state) => ({
      breadcrumbs: state.breadcrumbs,
      resetBreadcrumbs: state.resetBreadcrumbs,
      setMap: state.setMap,
      year: state.year,
    })),
  );
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLayersLoading, setIsLayersLoading] = useState(false);

  const handleHome = () =>
    handleHomeReset(mapRef.current, resetBreadcrumbs, DEFAULT_CENTER, DEFAULT_ZOOM);

  const handleBreadcrumbClick = (level) => {
    const { breadcrumbs, updateBreadcrumb } = useMapStore.getState();
    return handleBreadcrumbDrill(mapRef.current, level, breadcrumbs, updateBreadcrumb);
  };

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: MAP_CONFIG.MIN_ZOOM,
      attributionControl: false,
    });

    mapInstance.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© LTKL · Auriga Nusantara',
      }),
      'bottom-right',
    );

    mapRef.current = mapInstance;
    setMap(mapInstance);

    function onMapLoad() {
      setIsMapReady(true);
    }

    if (mapInstance.isStyleLoaded()) {
      onMapLoad();
    } else {
      mapInstance.on('load', onMapLoad);
    }

    const scaleControl = new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' });
    mapInstance.addControl(scaleControl, 'bottom-right');

    return () => {
      mapInstance.off('load', onMapLoad);
      try {
        mapInstance.remove();
      } catch {
        void 0;
      }
      mapRef.current = null;
      setIsMapReady(false);
      setMap(null);
    };
  }, [setMap]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    const target = {
      kabupaten: breadcrumbs.kab ?? null,
      kecamatan: breadcrumbs.kec ?? null,
      desa: breadcrumbs.des ?? null,
      year,
    };

    transitionMainMap({
      map: mapRef.current,
      target,
      setLoading: setIsLayersLoading,
    }).catch((error) => {
      if (error?.name !== 'AbortError') console.error(error);
    });

    return () => {
      abortActiveRequests();
      setIsLayersLoading(false);
    };
  }, [breadcrumbs, isMapReady, year]);

  return (
    <>
      <div ref={mapContainer} className="h-full w-full" />

      {!isMapReady && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gray-100">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-medium tracking-wide">Memuat peta…</p>
        </div>
      )}

      {isLayersLoading && isMapReady && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-gray-900/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10 shadow-lg pointer-events-none">
          <div className="w-3 h-3 border border-teal-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/80 font-medium">Memuat layer…</span>
        </div>
      )}

      {isMapReady && (
        <button
          onClick={onToggleSidebar}
          className="absolute top-4 right-4 z-20 lg:hidden flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-md rounded-lg shadow-lg border border-white/10 px-2.5 py-1.5 hover:bg-gray-900/90 transition-colors cursor-pointer"
          aria-label="Buka menu"
        >
          <Menu size={14} className="text-white/80" />
        </button>
      )}

      {isMapReady && (
        <div className="absolute bottom-10 left-4 flex flex-col gap-1 items-start select-none">
          <MapLegend />
          <TimeSeriesSelector />
        </div>
      )}

      <BreadcrumbsComponent onHome={handleHome} handleBreadcrumbs={handleBreadcrumbClick} />
    </>
  );
};

export default Map;
