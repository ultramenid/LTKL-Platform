import { useEffect, useState } from "react";
import { useMapStore } from "../store/mapStore.js";
import { loadLayer, loadGEEPolygonRaster, removeLayerAndSource } from "../store/mapLayerStore.js";
import { zoomToMatchingFeature, waitForSourceData } from "../utils/mapUtils.js";
import { KABUPATENS, DEFAULT_DESCRIPTION } from "../data/kabupatens.js";
import { LAYER_TYPES, SOURCE_IDS, LAYER_IDS } from "../config/constants.js";

// Komponen untuk menampilkan list kabupaten di sidebar kiri
// User bisa klik untuk drill ke kecamatan dalam kabupaten itu
export function KabupatenCard() {
  const { map, updateBreadcrumb, selectedKab, setSelectedKab } = useMapStore();
  const [isMapReady, setIsMapReady] = useState(false);

  // Check apakah map sudah siap (agar bisa load layers)
  useEffect(() => {
    if (map?.isStyleLoaded()) setIsMapReady(true);
    else map?.on("load", () => setIsMapReady(true));
  }, [map]);

  // Click kabupaten: update breadcrumb, zoom ke kabupaten, load kecamatan layer
  const handleKabupatenClick = async (kabupatenName) => {
    if (!map) return console.warn("⚠️ Map not ready");
    
    // Update state dengan kabupaten yang dipilih
    setSelectedKab(kabupatenName);
    updateBreadcrumb("kabupaten", kabupatenName);
    updateBreadcrumb("kecamatan", undefined); // Reset level lebih dalam
    updateBreadcrumb("desa", undefined);

    // Flow: Load zoom layer → Zoom → Load raster → Load kecamatan layer
    
    // Load kabupaten zoom layer dengan filter
    const kabupatenFilter = `kab='${kabupatenName}'`;
    await loadLayer(map, LAYER_TYPES.KABUPATEN, SOURCE_IDS.ZOOM_KABUPATEN, LAYER_IDS.KABUPATEN_FILL, kabupatenFilter);
    await waitForSourceData(map, SOURCE_IDS.ZOOM_KABUPATEN);
    zoomToMatchingFeature(map, SOURCE_IDS.ZOOM_KABUPATEN, "kab", kabupatenName);
    
    // Load GEE coverage untuk kabupaten ini
    await loadGEEPolygonRaster(map, { kab: kabupatenName });
    
    // Load kecamatan boundaries di dalam kabupaten, hapus kabupaten layer lama
    await loadLayer(
      map,
      LAYER_TYPES.KECAMATAN,
      SOURCE_IDS.KECAMATAN,
      LAYER_IDS.KECAMATAN_FILL,
      `kab='${kabupatenName}'`,
      [LAYER_IDS.KABUPATEN_FILL]
    );
    removeLayerAndSource(map, LAYER_IDS.KABUPATEN_FILL);
  };

  // Loading skeleton saat map belum siap
  if (!isMapReady) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 border-b border-gray-200 pb-3">
            <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
              <div className="h-2 w-full bg-gray-100 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render list kabupaten
  return (
    <>
      {KABUPATENS.map((kabupaten) => (
        <div key={kabupaten.name} className={`border-[#134e4a]/50 border-b ${selectedKab === kabupaten.name ? 'bg-[#f0fdfa]' : ''}`}>
          <div
            onClick={() => {
              setSelectedKab(selectedKab === kabupaten.name ? null : kabupaten.name);
              handleKabupatenClick(kabupaten.name);
            }}
            className="flex flex-col items-center justify-center shadow-[#5eead4] cursor-pointer w-full hover:bg-cyan-50 transition-all duration-300 ease-in-out px-4 py-2"
          >
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-1 items-center">
                <div className="w-3/12 flex items-center justify-center">
                  <img src={kabupaten.logoUrl} alt={kabupaten.name} className="h-12" />
                </div>
                <div className="flex flex-col flex-1">
                  <h1 className="font-bold">Kab. {kabupaten.name}</h1>
                  <h5 className="text-xs">{kabupaten.role}</h5>
                </div>
              </div>
              {selectedKab !== kabupaten.name && (
                <p className="text-xs">{DEFAULT_DESCRIPTION}</p>
              )}
            </div>
          </div>
          {selectedKab === kabupaten.name && (
            <div className="bg-gradient-to-b from-cyan-50 to-white px-4 py-4">
              <div className="space-y-3">
                <p className="text-xs text-gray-700">{DEFAULT_DESCRIPTION}</p>
                <button className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 transition text-sm cursor-pointer">
                  Lihat profile kabupaten
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
