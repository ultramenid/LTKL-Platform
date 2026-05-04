import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useMapStore } from '../../store/mapStore.js';
import {
  loadLayer,
  loadGEEPolygonRaster,
  removeLayerAndSource,
} from '../../store/mapLayerStore.js';
import { zoomToMatchingFeature, waitForSourceData } from '../../utils/mapUtils.js';
import { KABUPATENS, DEFAULT_DESCRIPTION } from '../../data/kabupatens.js';
import { LAYER_TYPES, SOURCE_IDS, LAYER_IDS } from '../../config/constants.js';
import { buildSingleFilter } from '../../utils/filterBuilder.js';

// Kabupaten list in sidebar — click to drill down to kecamatan level
export function KabupatenCard({ filterText = '' }) {
  // useShallow so re-render only happens when these field values change, not on every store update
  const { map, updateBreadcrumb, selectedKab, setSelectedKab } = useMapStore(
    useShallow((state) => ({
      map: state.map,
      updateBreadcrumb: state.updateBreadcrumb,
      selectedKab: state.selectedKab,
      setSelectedKab: state.setSelectedKab,
    })),
  );
  const [isMapReady, setIsMapReady] = useState(false);

  // Check map readiness so layer loading doesn't start prematurely
  useEffect(() => {
    if (map?.isStyleLoaded()) setIsMapReady(true);
    else map?.on('load', () => setIsMapReady(true));
  }, [map]);

  // Kabupaten click to sync breadcrumbs then load kecamatan level
  const handleKabupatenClick = async (kabupatenName) => {
    if (!map) return console.warn('Map not ready');

    setSelectedKab(kabupatenName);
    updateBreadcrumb('kabupaten', kabupatenName);
    updateBreadcrumb('kecamatan', undefined);
    updateBreadcrumb('desa', undefined);

    const kabupatenFilter = buildSingleFilter('kab', kabupatenName);
    await loadLayer(
      map,
      LAYER_TYPES.KABUPATEN,
      SOURCE_IDS.ZOOM_KABUPATEN,
      LAYER_IDS.KABUPATEN_FILL,
      kabupatenFilter,
    );
    await waitForSourceData(map, SOURCE_IDS.ZOOM_KABUPATEN);
    zoomToMatchingFeature(map, SOURCE_IDS.ZOOM_KABUPATEN, 'kab', kabupatenName);

    await loadGEEPolygonRaster(map, { kab: kabupatenName });

    // Load kecamatan boundaries then clean up old layers to avoid visual stacking
    // loadLayer already removes kabupaten-fill via removeLayerIds
    // DESA_FILL and KECAMATAN_FILL removed separately as they might still exist from previous navigation
    await loadLayer(
      map,
      LAYER_TYPES.KECAMATAN,
      SOURCE_IDS.KECAMATAN,
      LAYER_IDS.KECAMATAN_FILL,
      buildSingleFilter('kab', kabupatenName),
      [LAYER_IDS.KABUPATEN_FILL],
    );
    // Clean up remaining layer from previous drill navigation (desa)
    removeLayerAndSource(map, LAYER_IDS.DESA_FILL);
  };

  // Show skeleton while map isn't ready so layout doesn't feel empty
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

  // Filter list by search text
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

  // Render kabupaten list after data is ready
  return (
    <div className="px-3 pb-3 space-y-1.5">
      {filtered.map((kabupaten) => {
        const isSelected = selectedKab === kabupaten.name;

        return (
          <div
            key={kabupaten.name}
            className={`rounded-xl overflow-hidden transition-all duration-200 border ${
              isSelected
                ? 'border-teal-200 shadow-sm shadow-teal-100/50'
                : 'border-transparent hover:border-gray-100'
            }`}
          >
            {/* ── Main card row ── */}
            <div
              onClick={() => {
                setSelectedKab(isSelected ? null : kabupaten.name);
                handleKabupatenClick(kabupaten.name);
              }}
              className={`flex items-center gap-3 px-3 py-3.5 cursor-pointer select-none transition-colors ${
                isSelected ? 'bg-teal-50/60' : 'hover:bg-gray-50 border-b border-gray-100'
              }`}
            >
              {/* Logo container */}
              <div
                className={`w-13 h-13 shrink-0 rounded-xl border flex items-center justify-center bg-white transition-colors ${
                  isSelected ? 'border-teal-200' : 'border-gray-100'
                }`}
              >
                <img
                  src={kabupaten.logoUrl}
                  alt={kabupaten.name}
                  className="w-10 h-10 object-contain"
                />
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold truncate leading-tight ${
                    isSelected ? 'text-teal-700' : 'text-gray-800'
                  }`}
                >
                  Kab. {kabupaten.name}
                </p>
                <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">
                  {kabupaten.role}
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed mt-1 line-clamp-2">
                  {DEFAULT_DESCRIPTION}
                </p>
              </div>
            </div>

            {/* ── Detail panel when selected ── */}
            {isSelected && (
              <div className="bg-teal-50/40 border-t border-teal-100/60 px-3 py-3">
                {/* Button to detail profile page */}
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
