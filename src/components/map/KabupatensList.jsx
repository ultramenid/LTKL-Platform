import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { pointOnFeature } from '@turf/turf';
import { useShallow } from 'zustand/react/shallow';
import { useMapStore } from '../../store/mapStore.js';
import { fetchGeoJSONFromWFS } from '../../store/mapLayerStore.js';
import { KABUPATENS, DEFAULT_DESCRIPTION } from '../../data/kabupatens.js';
import { LAYER_TYPES } from '../../config/constants.js';
import { findFeatureInCollection } from '../../utils/mapUtils.js';

const createHoverMarkerElement = () => {
  const markerElement = document.createElement('div');
  markerElement.className =
    'text-teal-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] pointer-events-none';
  markerElement.setAttribute('aria-hidden', 'true');
  markerElement.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" fill="white" stroke="white" />
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

    const markerPoint = pointOnFeature(kabupatenFeature);
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
            <div key={index} className="w-10 h-10 rounded-xl bg-gray-100" />
          ))}
        </div>
      );
    }
    return (
      <div className="px-3 py-2 space-y-1.5 animate-pulse">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
            <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 bg-gray-200 rounded" />
              <div className="h-2 w-1/2 bg-gray-100 rounded" />
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
        <p className="text-xs text-gray-400">Tidak ada kabupaten ditemukan</p>
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
                  ? 'border-teal-300 ring-2 ring-teal-100 shadow-sm'
                  : 'border-gray-100 hover:border-teal-200 hover:shadow-sm'
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
                ? 'border-teal-200 bg-teal-50/50 shadow-sm shadow-teal-100/50'
                : 'border-transparent hover:bg-gray-50'
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
                  isSelected ? 'border-teal-200' : 'border-gray-100'
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
                  className={`block text-[13px] font-semibold truncate leading-tight ${
                    isSelected ? 'text-teal-700' : 'text-gray-800'
                  }`}
                >
                  Kab. {kabupaten.name}
                </span>
                <span
                  className={`block text-[11px] truncate leading-tight mt-0.5 ${
                    isSelected ? 'text-teal-600/70' : 'text-gray-400'
                  }`}
                >
                  {kabupaten.role}
                </span>
              </span>

              <ChevronDown
                size={14}
                className={`shrink-0 transition-transform duration-200 ${
                  isSelected ? 'rotate-180 text-teal-500' : 'text-gray-300'
                }`}
                aria-hidden="true"
              />
            </button>

            {isSelected && (
              <div className="px-3 pb-3">
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3 mb-2.5">
                  {DEFAULT_DESCRIPTION}
                </p>
                <Link
                  to={`/profile/${encodeURIComponent(kabupaten.name)}`}
                  className="flex items-center justify-between w-full px-3 py-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors group"
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
