import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CalendarDays, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { ProfileSection, SectionHeader } from './ProfileSection.jsx';
import CoverageChart from '../map/CoverageChart.jsx';
import MapLegend from '../map/MapLegend.jsx';
import { useMapStore } from '../../store/mapStore.js';
import {
  loadLayerWithCallback,
  loadGEEPolygonRaster,
  removeLayerAndSource,
  abortActiveRequests,
  getActiveSignal,
} from '../../store/mapLayerStore.js';
import { buildSingleFilter, buildDesaFilter } from '../../utils/filterBuilder.js';
import {
  MAP_CONFIG,
  COLORS,
  LAYER_TYPES,
  LAYER_IDS,
  SOURCE_IDS,
  YEAR_CONFIG,
} from '../../config/constants.js';
import { zoomToCollection } from '../../utils/mapUtils.js';

function ProfileYearSelector({ year, onYearChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredYear, setHoveredYear] = useState(null);
  const yearList = Array.from(
    { length: YEAR_CONFIG.MAX - YEAR_CONFIG.MIN + 1 },
    (_, index) => YEAR_CONFIG.MIN + index,
  );

  return (
    <div>
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-md rounded-lg shadow-lg border border-white/10 px-2.5 py-1.5 hover:bg-gray-900/90 transition-colors cursor-pointer"
        >
          <CalendarDays size={12} className="text-teal-400" />
          <span className="text-xs font-black text-teal-400">{year}</span>
          <ChevronRight size={14} className="text-white" />
        </button>
      )}
      {isExpanded && (
        <div className="bg-gray-900/80 backdrop-blur-md rounded-xl shadow-lg border border-white/10 px-3 py-2 flex items-start lg:items-center gap-3">
          <button
            onClick={() => setIsExpanded(false)}
            className="shrink-0 text-right cursor-pointer hover:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-1">
              <ChevronLeft size={12} className="text-white/30" />
              <p className="text-[8px] text-white/40 uppercase tracking-widest font-semibold leading-none">
                Tahun
              </p>
            </div>
            <p className="text-sm font-black text-teal-400 leading-tight mt-0.5">{year}</p>
          </button>
          <div className="w-px h-5 bg-white/10 shrink-0" />
          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2 pointer-events-none" />
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-1.5 max-w-[12rem] lg:max-w-none">
              {yearList.map((yearOption) => (
                <div key={yearOption} className="relative flex items-center justify-center">
                  {hoveredYear === yearOption && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-teal-500 text-white text-[9px] font-bold rounded shadow-lg whitespace-nowrap z-10">
                      {yearOption}
                    </div>
                  )}
                  <button
                    onClick={() => onYearChange(yearOption)}
                    onMouseEnter={() => setHoveredYear(yearOption)}
                    onMouseLeave={() => setHoveredYear(null)}
                    className={`z-10 rounded-full cursor-pointer border transition-all duration-200 ${
                      yearOption === year
                        ? 'w-2.5 h-2.5 bg-teal-400 border-teal-300 shadow-md shadow-teal-500/40 scale-110'
                        : yearOption < year
                          ? 'w-2 h-2 bg-teal-700 border-teal-600 hover:bg-teal-500'
                          : 'w-2 h-2 bg-white/20 border-white/10 hover:bg-white/40'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMapBreadcrumbs({ kabupaten, kec, des, onHome, onKecClick }) {
  const breadcrumbItems = [
    { level: 'kab', label: kabupaten },
    kec ? { level: 'kec', label: kec } : null,
    des ? { level: 'des', label: des } : null,
  ].filter(Boolean);

  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-gray-900/75 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-lg border border-white/10">
      <button
        onClick={onHome}
        className={`cursor-pointer flex items-center justify-center w-5 h-5 rounded-md transition-colors hover:text-teal-400 ${
          breadcrumbItems.length <= 1 ? 'text-teal-400' : 'text-white/60'
        }`}
        title={`Kembali ke ${kabupaten}`}
      >
        <Home size={12} />
      </button>
      {breadcrumbItems.map((item, index) => {
        const isLastItem = index === breadcrumbItems.length - 1;
        return (
          <span key={item.level} className="flex items-center gap-1">
            <ChevronRight size={10} className="text-white/25 shrink-0" />
            <button
              onClick={() => {
                if (item.level === 'kab') onHome();
                else if (item.level === 'kec') onKecClick(item.label);
              }}
              className={`text-[11px] font-semibold transition-colors whitespace-nowrap ${
                isLastItem
                  ? 'text-teal-400 cursor-default'
                  : 'text-white/80 hover:text-teal-400 cursor-pointer'
              }`}
            >
              {item.label}
            </button>
          </span>
        );
      })}
    </div>
  );
}

export function MapTab({ kabupaten, initialDrillState, onStateChange }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const kecLayerCleanupRef = useRef(null);
  const desLayerCleanupRef = useRef(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isLayerLoading, setIsLayerLoading] = useState(true);
  const [localBreadcrumbs, setLocalBreadcrumbs] = useState({
    kec: initialDrillState?.kec ?? null,
    des: initialDrillState?.des ?? null,
  });

  const { year, setYear } = useMapStore(
    useShallow((state) => ({ year: state.year, setYear: state.setYear })),
  );

  const localBreadcrumbsRef = useRef(localBreadcrumbs);
  useEffect(() => {
    localBreadcrumbsRef.current = localBreadcrumbs;
  }, [localBreadcrumbs]);

  const previousYearRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_CONFIG.STYLE_URL,
      center: MAP_CONFIG.DEFAULT_CENTER,
      zoom: 5,
      minZoom: 3,
      attributionControl: false,
      cooperativeGestures: true,
    });

    mapInstance.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© LTKL · Auriga Nusantara',
      }),
      'bottom-right',
    );
    mapInstance.addControl(
      new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }),
      'bottom-right',
    );

    mapRef.current = mapInstance;

    function onMapLoad() {
      setIsMapReady(true);
    }

    if (mapInstance.isStyleLoaded()) {
      onMapLoad();
    } else {
      mapInstance.on('load', onMapLoad);
    }

    return () => {
      mapInstance.off('load', onMapLoad);
      kecLayerCleanupRef.current?.();
      desLayerCleanupRef.current?.();
      try {
        mapInstance.remove();
      } catch {
        void 0;
      }
      mapRef.current = null;
      setIsMapReady(false);
      setIsLayerLoading(false);
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    abortActiveRequests();

    let isEffectActive = true;
    abortActiveRequests();
    const signal = getActiveSignal();
    setIsLayerLoading(true);

    const mapInstance = mapRef.current;
    const { kec, des } = localBreadcrumbs;

    const loadLayersAndGEE = async () => {
      kecLayerCleanupRef.current?.();
      kecLayerCleanupRef.current = null;
      desLayerCleanupRef.current?.();
      desLayerCleanupRef.current = null;

      removeLayerAndSource(mapInstance, LAYER_IDS.KECAMATAN_FILL);
      removeLayerAndSource(mapInstance, LAYER_IDS.DESA_FILL);

      if (!kec) {
        const { geojson: kecGeoJson, cleanup } = await loadLayerWithCallback(
          mapInstance,
          LAYER_TYPES.KECAMATAN,
          SOURCE_IDS.KECAMATAN,
          LAYER_IDS.KECAMATAN_FILL,
          buildSingleFilter('kab', kabupaten),
          (clickedFeature) =>
            setLocalBreadcrumbs({ kec: clickedFeature.properties.kec, des: null }),
          signal,
        );
        if (!isEffectActive) return;
        kecLayerCleanupRef.current = cleanup;

        if (kecGeoJson) zoomToCollection(mapInstance, kecGeoJson, 20);
        if (!isEffectActive) return;

        await loadGEEPolygonRaster(mapInstance, { kab: kabupaten }, signal);
      } else if (!des) {
        const { geojson: desaGeoJson, cleanup } = await loadLayerWithCallback(
          mapInstance,
          LAYER_TYPES.DESA,
          SOURCE_IDS.DESA,
          LAYER_IDS.DESA_FILL,
          buildSingleFilter('kec', kec),
          (clickedFeature) =>
            setLocalBreadcrumbs((previous) => ({
              ...previous,
              des: clickedFeature.properties.des,
            })),
          signal,
        );
        if (!isEffectActive) return;
        desLayerCleanupRef.current = cleanup;

        if (desaGeoJson) zoomToCollection(mapInstance, desaGeoJson, 60);
        if (!isEffectActive) return;

        await loadGEEPolygonRaster(mapInstance, { kec }, signal);
      } else {
        const { geojson: selectedDesaGeoJson, cleanup } = await loadLayerWithCallback(
          mapInstance,
          LAYER_TYPES.DESA,
          SOURCE_IDS.DESA,
          LAYER_IDS.DESA_FILL,
          buildDesaFilter({ kab: kabupaten, kec, des }),
          (clickedFeature) =>
            setLocalBreadcrumbs((previous) => ({
              ...previous,
              des: clickedFeature.properties.des,
            })),
          signal,
        );
        if (!isEffectActive) return;
        desLayerCleanupRef.current = cleanup;

        if (selectedDesaGeoJson) zoomToCollection(mapInstance, selectedDesaGeoJson, 40);
        if (!isEffectActive) return;

        await loadGEEPolygonRaster(mapInstance, { des }, signal);
      }
    };

    loadLayersAndGEE()
      .catch((error) => {
        if (error.name !== 'AbortError') console.error('MapTab load error:', error);
      })
      .finally(() => {
        if (isEffectActive) setIsLayerLoading(false);
      });

    return () => {
      isEffectActive = false;
    };
  }, [isMapReady, localBreadcrumbs, kabupaten]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    if (previousYearRef.current === null) {
      previousYearRef.current = year;
      return;
    }
    if (previousYearRef.current === year) return;
    previousYearRef.current = year;

    abortActiveRequests();
    const signal = getActiveSignal();
    const { kec, des } = localBreadcrumbsRef.current;
    const geeFilter = des ? { des } : kec ? { kec } : { kab: kabupaten };
    loadGEEPolygonRaster(mapRef.current, geeFilter, signal).catch((error) => {
      if (error.name !== 'AbortError') console.error('MapTab year load error:', error);
    });
  }, [year, isMapReady, kabupaten]);

  useEffect(() => {
    onStateChange?.(year, { kab: kabupaten, ...localBreadcrumbs });
  }, [year, localBreadcrumbs, kabupaten, onStateChange]);

  return (
    <ProfileSection>
      <div>
        <SectionHeader
          title="Peta Tutupan Lahan (LULC)"
          borderColor={COLORS.PRIMARY}
          dotColor={COLORS.PRIMARY}
        />
        <p className="text-xs text-gray-500 mt-2 mb-4">
          Citra tutupan lahan berbasis Google Earth Engine (MapBiomas Indonesia Collection 4). Klik
          wilayah untuk drill-down ke kecamatan lalu desa.
        </p>

        <div className="relative w-full h-[65vh] rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <div ref={mapContainerRef} className="w-full h-full" />

          {isMapReady && (
            <ProfileMapBreadcrumbs
              kabupaten={kabupaten}
              kec={localBreadcrumbs.kec}
              des={localBreadcrumbs.des}
              onHome={() => setLocalBreadcrumbs({ kec: null, des: null })}
              onKecClick={(kecLabel) => setLocalBreadcrumbs({ kec: kecLabel, des: null })}
            />
          )}

          {!isMapReady && (
            <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400 font-medium tracking-wide">
                Memuat peta {kabupaten}…
              </p>
            </div>
          )}

          {isLayerLoading && isMapReady && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-gray-900/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10 shadow-lg pointer-events-none">
              <div className="w-3 h-3 border border-teal-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-white/80 font-medium">Memuat layer…</span>
            </div>
          )}

          {isMapReady && (
            <div className="absolute bottom-8 left-3 flex flex-col gap-1 items-start select-none z-10">
              <MapLegend />
              <ProfileYearSelector
                year={year}
                onYearChange={(selectedYear) => setYear(selectedYear)}
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionHeader
          title="Statistik Cakupan Area LULC"
          borderColor={COLORS.PRIMARY}
          dotColor={COLORS.PRIMARY}
        />
        <p className="text-xs text-gray-500 mt-2 mb-4">
          Luas tutupan lahan per kabupaten untuk tahun{' '}
          <strong className="text-gray-700">{year}</strong>. Data bersumber dari MapBiomas Indonesia
          Collection 4 via GEE tile server.
        </p>
        <div className="h-72 rounded-xl border border-gray-100 shadow-sm overflow-hidden bg-white">
          <CoverageChart />
        </div>
      </div>
    </ProfileSection>
  );
}
