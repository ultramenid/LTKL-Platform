import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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

export function KabupatenCard({ filterText = '' }) {
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
    return (
      <div className="px-3 py-2 space-y-2 animate-pulse">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-11 h-11 bg-gray-200 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-2/3 bg-gray-200 rounded" />
              <div className="h-2 w-full bg-gray-150 rounded" />
              <div className="h-1.5 w-full bg-gray-100 rounded-full" />
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

  return (
    <div className="px-3 pb-3 space-y-1.5">
      {filtered.map((kabupaten) => {
        const isSelected = selectedKab === kabupaten.name;

        return (
          <div
            key={kabupaten.name}
            onMouseEnter={() => showHoverMarker(kabupaten.name)}
            onMouseLeave={removeHoverMarker}
            onFocus={() => showHoverMarker(kabupaten.name)}
            onBlur={removeHoverMarker}
            className={`rounded-xl overflow-hidden transition-all duration-200 border ${
              isSelected
                ? 'border-teal-200 shadow-sm shadow-teal-100/50'
                : 'border-transparent hover:border-gray-100'
            }`}
          >
            <button
              type="button"
              onClick={() => handleKabupatenClick(kabupaten.name)}
              className={`flex w-full items-center gap-3 px-3 py-3.5 text-left cursor-pointer select-none transition-colors ${
                isSelected ? 'bg-teal-50/60' : 'hover:bg-gray-50 border-b border-gray-100'
              }`}
            >
              <span
                className={`w-13 h-13 shrink-0 rounded-xl border flex items-center justify-center bg-white transition-colors ${
                  isSelected ? 'border-teal-200' : 'border-gray-100'
                }`}
              >
                <img
                  src={kabupaten.logoUrl}
                  alt={kabupaten.name}
                  className="w-10 h-10 object-contain"
                />
              </span>

              <span className="flex-1 min-w-0">
                <span
                  className={`block text-sm font-bold truncate leading-tight ${
                    isSelected ? 'text-teal-700' : 'text-gray-800'
                  }`}
                >
                  Kab. {kabupaten.name}
                </span>
                <span className="block text-xs text-gray-400 truncate leading-tight mt-0.5">
                  {kabupaten.role}
                </span>
                <span className="block text-[11px] text-gray-500 leading-relaxed mt-1 line-clamp-2">
                  {DEFAULT_DESCRIPTION}
                </span>
              </span>
            </button>

            {isSelected && (
              <div className="bg-teal-50/40 border-t border-teal-100/60 px-3 py-3">
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
