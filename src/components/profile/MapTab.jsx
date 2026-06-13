import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CalendarDays, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { COLORS } from '../../config/constants.js';
import { ProfileSection } from './ProfileSection.jsx';
import { SectionHeader } from './SectionHeader.jsx';
import CoverageChart from '../map/CoverageChart.jsx';
import StackCoverageChart from '../map/StackCoverageChart.jsx';
import SankeyTransitionChart from '../map/SankeyTransitionChart.jsx';
import ChartYearRangeSelector from '../map/ChartYearRangeSelector.jsx';
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
  LAYER_TYPES,
  LAYER_IDS,
  SOURCE_IDS,
  YEAR_CONFIG,
} from '../../config/constants.js';
import { zoomToCollection } from '../../utils/mapUtils.js';
import { encodeAdministrasi, parseUrlState } from '../../utils/urlStateSync.js';

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
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-1 bg-coffee-900/85 backdrop-blur-md rounded-lg shadow-lg border border-white/10 px-2 py-1 hover:bg-coffee-900/95 transition-colors cursor-pointer"
        >
          <CalendarDays size={10} className="text-primary" />
          <span className="text-[11px] font-semibold text-primary">{year}</span>
          <ChevronRight size={12} className="text-white/80" />
        </button>
      )}
      {isExpanded && (
        <div className="bg-coffee-900/85 backdrop-blur-md rounded-xl shadow-lg border border-white/10 px-2 py-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="shrink-0 text-right cursor-pointer hover:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-1">
              <ChevronLeft size={10} className="text-white/50" />
              <p className="text-[8px] text-white/50 uppercase tracking-wider font-medium leading-none">
                Tahun
              </p>
            </div>
            <p className="text-xs font-semibold text-primary leading-tight mt-0.5">{year}</p>
          </button>
          <div className="w-px h-4 bg-white/10 shrink-0" />
          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2 pointer-events-none" />
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-1 max-w-[10rem] lg:max-w-none">
              {yearList.map((yearOption) => (
                <div key={yearOption} className="relative flex items-center justify-center">
                  {hoveredYear === yearOption && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-primary text-white text-[8px] font-medium rounded shadow-lg whitespace-nowrap z-10">
                      {yearOption}
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label={`Pilih tahun ${yearOption}`}
                    onClick={() => onYearChange(yearOption)}
                    onMouseEnter={() => setHoveredYear(yearOption)}
                    onMouseLeave={() => setHoveredYear(null)}
                    className={`z-10 rounded-full cursor-pointer border transition-all duration-200 ${
                      yearOption === year
                        ? 'w-2 h-2 bg-primary border-primary/70 shadow-sm shadow-primary/40 scale-110'
                        : yearOption < year
                          ? 'w-1.5 h-1.5 bg-primary/50 border-primary/40 hover:bg-primary/80'
                          : 'w-1.5 h-1.5 bg-white/20 border-white/10 hover:bg-white/40'
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
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-coffee-900/80 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-lg border border-white/10">
      <button
        type="button"
        onClick={onHome}
        className={`cursor-pointer flex items-center justify-center w-5 h-5 rounded-md transition-colors hover:text-primary ${
          breadcrumbItems.length <= 1 ? 'text-primary' : 'text-white/60'
        }`}
        title={`Kembali ke ${kabupaten}`}
      >
        <Home size={12} />
      </button>
      {breadcrumbItems.map((item, index) => {
        const isLastItem = index === breadcrumbItems.length - 1;
        return (
          <span key={item.level} className="flex items-center gap-1">
            <ChevronRight size={10} className="text-white/50 shrink-0" />
            <button
              type="button"
              onClick={() => {
                if (item.level === 'kab') onHome();
                else if (item.level === 'kec') onKecClick(item.label);
              }}
              className={`text-[11px] transition-colors whitespace-nowrap ${
                isLastItem
                  ? 'font-semibold text-primary cursor-default'
                  : 'font-medium text-white/80 hover:text-primary cursor-pointer'
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

function createBooleanStore(initialValue) {
  let value = initialValue;
  const listeners = new Set();

  return {
    getSnapshot: () => value,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set: (nextValue) => {
      if (value === nextValue) return;
      value = nextValue;
      listeners.forEach((listener) => listener());
    },
  };
}

const getServerMapReady = () => false;

function useProfileMap({ kabupaten, initialDrillState }) {
  const [, setSearchParams] = useSearchParams();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapReadyStoreRef = useRef(null);
  if (mapReadyStoreRef.current === null) {
    mapReadyStoreRef.current = createBooleanStore(false);
  }
  const mapReadyStore = mapReadyStoreRef.current;

  const kecLayerCleanupRef = useRef(null);
  const desLayerCleanupRef = useRef(null);

  const isMapReady = useSyncExternalStore(
    mapReadyStore.subscribe,
    mapReadyStore.getSnapshot,
    getServerMapReady,
  );
  const [isLayerLoading, setIsLayerLoading] = useState(true);
  const [localBreadcrumbs, setLocalBreadcrumbs] = useState({
    kec: initialDrillState?.kec ?? null,
    des: initialDrillState?.des ?? null,
  });

  const { year, setYear } = useMapStore(
    useShallow((state) => ({ year: state.year, setYear: state.setYear })),
  );

  const { chartStartYear, chartEndYear } = useMapStore(
    useShallow((state) => ({
      chartStartYear: state.chartStartYear,
      chartEndYear: state.chartEndYear,
    })),
  );

  // Restore the shared analytics range from the URL on mount so refresh and
  // shared links reopen the same chart scope. The store writer (updateUrl) is
  // map-route only, so the profile tab seeds + persists the range itself.
  useEffect(() => {
    const restored = parseUrlState();
    useMapStore.setState({
      chartStartYear: restored.chartStartYear,
      chartEndYear: restored.chartEndYear,
    });
    // Mount-only: seed once from the initial URL.
  }, []);

  // Persist range changes into the profile URL via React Router. Skip the first
  // run so we don't write default params before the user touches the slider.
  const didPersistRangeRef = useRef(false);
  useEffect(() => {
    if (!didPersistRangeRef.current) {
      didPersistRangeRef.current = true;
      return;
    }
    setSearchParams(
      (previousParams) => {
        const updatedParams = new URLSearchParams(previousParams);
        updatedParams.set('chartStart', String(chartStartYear));
        updatedParams.set('chartEnd', String(chartEndYear));
        return updatedParams;
      },
      { replace: true },
    );
  }, [chartStartYear, chartEndYear, setSearchParams]);

  const localBreadcrumbsRef = useRef(localBreadcrumbs);
  const syncMapUrl = useCallback(
    (selectedYear, breadcrumbs) => {
      setSearchParams(
        (previousParams) => {
          const updatedParams = new URLSearchParams(previousParams);
          updatedParams.set('year', String(selectedYear));
          updatedParams.set('administrasi', encodeAdministrasi({ kab: kabupaten, ...breadcrumbs }));
          return updatedParams;
        },
        { replace: true },
      );
    },
    [kabupaten, setSearchParams],
  );

  const commitBreadcrumbs = useCallback(
    (nextBreadcrumbsOrUpdater) => {
      const nextBreadcrumbs =
        typeof nextBreadcrumbsOrUpdater === 'function'
          ? nextBreadcrumbsOrUpdater(localBreadcrumbsRef.current)
          : nextBreadcrumbsOrUpdater;
      localBreadcrumbsRef.current = nextBreadcrumbs;
      setIsLayerLoading(true);
      setLocalBreadcrumbs(nextBreadcrumbs);
      syncMapUrl(useMapStore.getState().year, nextBreadcrumbs);
    },
    [syncMapUrl],
  );
  const commitBreadcrumbsRef = useRef(commitBreadcrumbs);
  useEffect(() => {
    commitBreadcrumbsRef.current = commitBreadcrumbs;
  }, [commitBreadcrumbs]);

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
      mapReadyStore.set(true);
    }

    if (mapInstance.isStyleLoaded()) {
      onMapLoad();
    } else {
      mapInstance.on('load', onMapLoad);
    }

    return () => {
      mapInstance.off('load', onMapLoad);
      try {
        mapInstance.remove();
      } catch {
        void 0;
      }
      mapRef.current = null;
      mapReadyStore.set(false);
    };
  }, [mapReadyStore]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    let isEffectActive = true;
    abortActiveRequests();
    const signal = getActiveSignal();

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
        if (!isEffectActive) return;
        const layerResult = await loadLayerWithCallback(
          mapInstance,
          LAYER_TYPES.KECAMATAN,
          SOURCE_IDS.KECAMATAN,
          LAYER_IDS.KECAMATAN_FILL,
          buildSingleFilter('kab', kabupaten),
          (clickedFeature) =>
            commitBreadcrumbsRef.current({
              kec: clickedFeature.properties.kec,
              des: null,
            }),
          signal,
        );
        const { geojson: kecGeoJson, cleanup } = layerResult;
        if (!isEffectActive) {
          cleanup?.();
          return;
        }
        kecLayerCleanupRef.current = cleanup;

        if (kecGeoJson) zoomToCollection(mapInstance, kecGeoJson, 20);
        if (!isEffectActive) return;

        await loadGEEPolygonRaster(mapInstance, { kab: kabupaten }, signal);
      } else if (!des) {
        if (!isEffectActive) return;
        const layerResult = await loadLayerWithCallback(
          mapInstance,
          LAYER_TYPES.DESA,
          SOURCE_IDS.DESA,
          LAYER_IDS.DESA_FILL,
          buildSingleFilter('kec', kec),
          (clickedFeature) =>
            commitBreadcrumbsRef.current((previous) => ({
              ...previous,
              des: clickedFeature.properties.des,
            })),
          signal,
        );
        const { geojson: desaGeoJson, cleanup } = layerResult;
        if (!isEffectActive) {
          cleanup?.();
          return;
        }
        desLayerCleanupRef.current = cleanup;

        if (desaGeoJson) zoomToCollection(mapInstance, desaGeoJson, 60);
        if (!isEffectActive) return;

        await loadGEEPolygonRaster(mapInstance, { kec }, signal);
      } else {
        if (!isEffectActive) return;
        const layerResult = await loadLayerWithCallback(
          mapInstance,
          LAYER_TYPES.DESA,
          SOURCE_IDS.DESA,
          LAYER_IDS.DESA_FILL,
          buildDesaFilter({ kab: kabupaten, kec, des }),
          (clickedFeature) =>
            commitBreadcrumbsRef.current((previous) => ({
              ...previous,
              des: clickedFeature.properties.des,
            })),
          signal,
        );
        const { geojson: selectedDesaGeoJson, cleanup } = layerResult;
        if (!isEffectActive) {
          cleanup?.();
          return;
        }
        desLayerCleanupRef.current = cleanup;

        if (selectedDesaGeoJson) zoomToCollection(mapInstance, selectedDesaGeoJson, 40);
        if (!isEffectActive) return;

        await loadGEEPolygonRaster(mapInstance, { des }, signal);
      }
    };

    Promise.resolve()
      .then(loadLayersAndGEE)
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

    let isEffectActive = true;
    abortActiveRequests();
    const signal = getActiveSignal();
    const { kec, des } = localBreadcrumbsRef.current;
    const geeFilter = des ? { des } : kec ? { kec } : { kab: kabupaten };

    loadGEEPolygonRaster(mapRef.current, geeFilter, signal)
      .catch((error) => {
        if (isEffectActive && error.name !== 'AbortError')
          console.error('MapTab year load error:', error);
      })
      .finally(() => {
        if (isEffectActive) setIsLayerLoading(false);
      });

    return () => {
      isEffectActive = false;
    };
  }, [year, isMapReady, kabupaten]);

  const handleYearChange = (selectedYear) => {
    setIsLayerLoading(true);
    setYear(selectedYear);
    syncMapUrl(selectedYear, localBreadcrumbsRef.current);
  };

  return {
    mapContainerRef,
    isMapReady,
    isLayerLoading,
    localBreadcrumbs,
    year,
    chartStartYear,
    chartEndYear,
    commitBreadcrumbs,
    handleYearChange,
  };
}

export function MapTab({ kabupaten, initialDrillState }) {
  const {
    mapContainerRef,
    isMapReady,
    isLayerLoading,
    localBreadcrumbs,
    year,
    chartStartYear,
    chartEndYear,
    commitBreadcrumbs,
    handleYearChange,
  } = useProfileMap({ kabupaten, initialDrillState });

  const activeAreaLabel = [kabupaten, localBreadcrumbs.kec, localBreadcrumbs.des]
    .filter(Boolean)
    .join(' › ');

  return (
    <ProfileSection>
      <div>
        <SectionHeader
          kicker="Peta Gotong Royong"
          title="Peta Tutupan Lahan (LULC)"
          accent={COLORS.PRIMARY}
        />
        <p className="text-xs text-coffee-600 -mt-2 mb-4 max-w-xl">
          Citra tutupan lahan berbasis Google Earth Engine (MapBiomas Indonesia Collection 4). Klik
          wilayah untuk drill-down ke kecamatan lalu desa.
        </p>

        <div className="relative w-full h-[65vh] overflow-hidden border border-coffee-900/20 bg-white p-1.5">
          <div ref={mapContainerRef} className="w-full h-full" />

          {isMapReady && (
            <ProfileMapBreadcrumbs
              kabupaten={kabupaten}
              kec={localBreadcrumbs.kec}
              des={localBreadcrumbs.des}
              onHome={() => commitBreadcrumbs({ kec: null, des: null })}
              onKecClick={(kecLabel) => commitBreadcrumbs({ kec: kecLabel, des: null })}
            />
          )}

          {!isMapReady && (
            <div className="absolute inset-0 bg-parchment-50 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-coffee-500 font-medium tracking-wide">
                Memuat peta {kabupaten}…
              </p>
            </div>
          )}

          {isLayerLoading && isMapReady && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-coffee-900/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10 shadow-lg pointer-events-none">
              <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-white/80 font-medium">Memuat layer…</span>
            </div>
          )}

          {isMapReady && (
            <div className="absolute bottom-8 left-3 flex flex-col gap-1 items-start select-none z-10">
              <MapLegend />
              <ProfileYearSelector year={year} onYearChange={handleYearChange} />
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionHeader title="Statistik Cakupan Area LULC" accent={COLORS.PRIMARY} />
        <p className="text-xs text-coffee-600 -mt-2 mb-4 max-w-xl">
          Luas tutupan lahan per kabupaten untuk tahun{' '}
          <strong className="text-coffee-900">{year}</strong>. Data bersumber dari MapBiomas
          Indonesia Collection 4 via GEE tile server.
        </p>
        <div className="h-72 border border-coffee-900/15 overflow-hidden bg-white">
          <CoverageChart />
        </div>
      </div>

      <div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <SectionHeader title="Komposisi Tutupan Lahan" accent={COLORS.PRIMARY} />
          <div className="shrink-0 pt-1">
            <ChartYearRangeSelector />
          </div>
        </div>
        <p className="text-xs text-coffee-600 -mt-2 mb-4 max-w-xl">
          Komposisi tutupan lahan{' '}
          <strong className="text-coffee-900">{activeAreaLabel}</strong> dari tahun{' '}
          <strong className="text-coffee-900">{chartStartYear}</strong> hingga{' '}
          <strong className="text-coffee-900">{chartEndYear}</strong>. Rentang tahun ini juga
          mengatur grafik transisi di bawah.
        </p>
        <div className="h-72 border border-coffee-900/15 overflow-hidden bg-white">
          <StackCoverageChart
            kabupaten={kabupaten}
            kec={localBreadcrumbs.kec}
            des={localBreadcrumbs.des}
          />
        </div>
      </div>

      <div>
        <SectionHeader title="Transisi Tutupan Lahan" accent={COLORS.PRIMARY} />
        <p className="text-xs text-coffee-600 -mt-2 mb-4 max-w-xl">
          Perubahan tutupan lahan <strong className="text-coffee-900">{activeAreaLabel}</strong>{' '}
          dari tahun <strong className="text-coffee-900">{chartStartYear}</strong> ke{' '}
          <strong className="text-coffee-900">{chartEndYear}</strong>.
        </p>
        <div className="h-72 border border-coffee-900/15 overflow-hidden bg-white">
          <SankeyTransitionChart
            kabupaten={kabupaten}
            kec={localBreadcrumbs.kec}
            des={localBreadcrumbs.des}
          />
        </div>
      </div>
    </ProfileSection>
  );
}
