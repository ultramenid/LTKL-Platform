import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { booleanPointInPolygon, centerOfMass, pointOnFeature } from '@turf/turf';
import { useShallow } from 'zustand/react/shallow';
import { useMapStore } from '../../store/mapStore.js';
import { fetchGeoJSONFromWFS } from '../../store/mapLayerStore.js';
import { KABUPATENS, DEFAULT_DESCRIPTION } from '../../data/kabupatens.js';
import { LAYER_TYPES } from '../../config/constants.js';
import { findFeatureInCollection } from '../../utils/mapUtils.js';

const createHoverMarkerElement = () => {
  const markerElement = document.createElement('div');
  markerElement.className =
    'text-primary drop-shadow-[0_2px_6px_rgba(20,184,166,0.55)] pointer-events-none';
  markerElement.setAttribute('aria-hidden', 'true');
  markerElement.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 24s-8-8.2-8-14a8 8 0 0 1 16 0c0 5.8-8 14-8 14z" fill="currentColor" stroke="white" stroke-width="1.5" />
      <circle cx="12" cy="9" r="2.6" fill="white" stroke="currentColor" stroke-width="1.5" />
    </svg>
  `;

  return markerElement;
};

export function KabupatenCard({ filterText = '', collapsed = false }) {
  const { map, updateBreadcrumb, selectedKab, setSelectedKab } = useMapStore(
    useShallow((state) => ({
      map: state.map,
      updateBreadcrumb: state.updateBreadcrumb,
      selectedKab: state.selectedKab,
      setSelectedKab: state.setSelectedKab,
    })),
  );
  const [isMapReady, setIsMapReady] = useState(false);
  const kabupatenGeoJsonRef = useRef(null);
  const hoverMarkerRef = useRef(null);

  const removeHoverMarker = () => {
    hoverMarkerRef.current?.remove();
    hoverMarkerRef.current = null;
  };

  useEffect(() => {
    if (!map) return;
    let cancelled = false;

    function onLoad() {
      setIsMapReady(true);
    }

    async function loadKabupatenGeoJson() {
      const geoJsonData = await fetchGeoJSONFromWFS(LAYER_TYPES.KABUPATEN);
      if (!cancelled) kabupatenGeoJsonRef.current = geoJsonData;
    }

    if (map.isStyleLoaded()) {
      setIsMapReady(true);
    } else {
      map.on('load', onLoad);
    }
    loadKabupatenGeoJson().catch((error) => {
      if (!cancelled && error?.name !== 'AbortError') console.error(error);
    });

    return () => {
      cancelled = true;
      map.off('load', onLoad);
      removeHoverMarker();
    };
  }, [map]);

  const showHoverMarker = (kabupatenName) => {
    if (!map) return;

    const kabupatenFeature = findFeatureInCollection(
      kabupatenGeoJsonRef.current,
      'kab',
      kabupatenName,
    );
    if (!kabupatenFeature) return;

    const centerPoint = centerOfMass(kabupatenFeature);
    const guaranteedPoint = pointOnFeature(kabupatenFeature);
    const markerPoint =
      centerPoint && booleanPointInPolygon(centerPoint, kabupatenFeature)
        ? centerPoint
        : guaranteedPoint;
    const coordinates = markerPoint?.geometry?.coordinates;
    if (!coordinates) return;

    removeHoverMarker();
    const markerElement = createHoverMarkerElement();
    const marker = new maplibregl.Marker({ element: markerElement, anchor: 'bottom' })
      .setLngLat(coordinates)
      .addTo(map);
    hoverMarkerRef.current = marker;
  };

  const handleKabupatenClick = (kabupatenName) => {
    if (!map) return console.warn('Map not ready');

    removeHoverMarker();
    setSelectedKab(kabupatenName);
    updateBreadcrumb('kabupaten', kabupatenName);
    updateBreadcrumb('kecamatan', undefined);
    updateBreadcrumb('desa', undefined);
  };

  if (!isMapReady) {
    if (collapsed) {
      return (
        <div className="flex flex-col items-center gap-2 px-2 pb-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="w-10 h-10 rounded-xl bg-parchment-200" />
          ))}
        </div>
      );
    }
    return (
      <div className="px-3 py-2 space-y-1.5 animate-pulse">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-parchment-50"
          >
            <div className="w-10 h-10 bg-parchment-300 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 bg-parchment-300 rounded" />
              <div className="h-2 w-1/2 bg-parchment-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const filtered = KABUPATENS.filter(
    (kabupatenEntry) =>
      !filterText || kabupatenEntry.name.toLowerCase().includes(filterText.toLowerCase()),
  );

  if (filtered.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-xs text-coffee-500">Tidak ada kabupaten ditemukan</p>
      </div>
    );
  }

  // ─── COLLAPSED RAIL — logo-only buttons ───
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-2 pb-3">
        {filtered.map((kabupaten) => {
          const isSelected = selectedKab === kabupaten.name;

          return (
            <button
              key={kabupaten.name}
              type="button"
              onClick={() => handleKabupatenClick(kabupaten.name)}
              onMouseEnter={() => showHoverMarker(kabupaten.name)}
              onMouseLeave={removeHoverMarker}
              onFocus={() => showHoverMarker(kabupaten.name)}
              onBlur={removeHoverMarker}
              title={`Kab. ${kabupaten.name}`}
              aria-label={`Kab. ${kabupaten.name}`}
              aria-pressed={isSelected}
              className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center bg-white transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-primary/70 ring-2 ring-primary/20 shadow-sm'
                  : 'border-coffee-900/10 hover:border-primary/30 hover:shadow-sm'
              }`}
            >
              <img
                src={kabupaten.logoUrl}
                alt=""
                className="w-7 h-7 object-contain"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    );
  }

  // ─── EXPANDED LIST ───
  return (
    <div className="px-3 pb-3 space-y-1">
      {filtered.map((kabupaten) => {
        const isSelected = selectedKab === kabupaten.name;

        return (
          <div
            key={kabupaten.name}
            onMouseEnter={() => showHoverMarker(kabupaten.name)}
            onMouseLeave={removeHoverMarker}
            onFocus={() => showHoverMarker(kabupaten.name)}
            onBlur={removeHoverMarker}
            className={`rounded-xl overflow-hidden border transition-all duration-200 ${
              isSelected
                ? 'border-primary/30 bg-parchment-50 shadow-sm shadow-primary/10'
                : 'border-coffee-900/5 bg-white hover:bg-parchment-100'
            }`}
          >
            <button
              type="button"
              onClick={() => handleKabupatenClick(kabupaten.name)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left cursor-pointer select-none"
              aria-expanded={isSelected}
            >
              <span
                className={`w-10 h-10 shrink-0 rounded-lg border flex items-center justify-center bg-white transition-colors ${
                  isSelected ? 'border-primary/20' : 'border-coffee-900/10'
                }`}
              >
                <img
                  src={kabupaten.logoUrl}
                  alt={kabupaten.name}
                  className="w-7 h-7 object-contain"
                />
              </span>

              <span className="flex-1 min-w-0">
                <span
                  className={`block text-sm truncate leading-tight ${
                    isSelected ? 'font-bold text-coffee-900' : 'font-semibold text-coffee-900'
                  }`}
                >
                  Kab. {kabupaten.name}
                </span>
                <span className="block text-[11px] truncate leading-tight mt-0.5 text-gray-400">
                  {kabupaten.role}
                </span>
              </span>

              <ChevronDown
                size={14}
                className={`shrink-0 transition-transform duration-200 ${
                  isSelected ? 'rotate-180 text-primary' : 'text-coffee-300'
                }`}
                aria-hidden="true"
              />
            </button>

            {isSelected && (
              <div className="px-3 pb-3">
                <p className="text-xs text-coffee-600 leading-relaxed line-clamp-3 mb-2.5">
                  {DEFAULT_DESCRIPTION}
                </p>
                <Link
                  to={`/profile/${encodeURIComponent(kabupaten.name)}`}
                  className="flex items-center justify-between w-full px-3 py-2 bg-coffee-900 text-white rounded-lg text-[11px] font-semibold tracking-wide transition-colors hover:bg-coffee-800 active:bg-coffee-700 group"
                >
                  <span>Lihat Profil Lengkap</span>
                  <ArrowRight
                    size={13}
                    className="group-hover:translate-x-0.5 transition-transform duration-150"
                  />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
