import { useEffect, useState } from "react";
import { useMapStore } from "../store/mapStore.js";
import { loadLayer, loadGEEPolygonRaster } from "../store/mapLayerStore.js";
import { zoomToFeature } from "../utils/mapUtils.js";
import { KABUPATENS, DEFAULT_DESCRIPTION } from "../data/kabupatens.js";

export function KabupatenCard() {
  const { map, updateBreadcrumb, selectedKab, setSelectedKab } = useMapStore();
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (map?.isStyleLoaded()) setIsMapReady(true);
    else map?.on("load", () => setIsMapReady(true));
  }, [map]);

  const handleKabupatenClick = async (kabName) => {
    if (!map) return console.warn("⚠️ Map not ready");
    setSelectedKab(kabName);
    updateBreadcrumb("kabupaten", kabName);
    updateBreadcrumb("kecamatan", undefined);
    updateBreadcrumb("desa", undefined);

    // Fetch geometry untuk kabupaten
    const url = `https://aws.simontini.id/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=LTKL:kabupaten&outputFormat=application/json&CQL_FILTER=kab='${kabName}'`;
    const res = await fetch(url);
    const geojson = await res.json();

    if (!geojson.features?.length) {
      console.warn(`⚠️ No geometry found for ${kabName}`);
      return;
    }

    const feature = geojson.features[0];
    zoomToFeature(map, feature);
    await loadGEEPolygonRaster(map, { kab: kabName });
    await loadLayer(
      map,
      "LTKL:kecamatan",
      "kecamatan-src",
      "kecamatan-fill",
      `kab='${kabName}'`,
      ["kabupaten-fill"]
    );
  };

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

  return (
    <>
      {KABUPATENS.map((kab) => (
        <div key={kab.name} className={`border-[#134e4a]/50 border-b ${selectedKab === kab.name ? 'bg-[#f0fdfa]' : ''}`}>
          <div
            onClick={() => {
              setSelectedKab(selectedKab === kab.name ? null : kab.name);
              handleKabupatenClick(kab.name);
            }}
            className="flex flex-col items-center justify-center shadow-[#5eead4] cursor-pointer w-full hover:bg-cyan-50 transition-all duration-300 ease-in-out px-4 py-2"
          >
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-1 items-center">
                <div className="w-3/12 flex items-center justify-center">
                  <img src={kab.logoUrl} alt={kab.name} className="h-12" />
                </div>
                <div className="flex flex-col flex-1">
                  <h1 className="font-bold">Kab. {kab.name}</h1>
                  <h5 className="text-xs">{kab.role}</h5>
                </div>
              </div>
              {selectedKab !== kab.name && (
                <p className="text-xs">{DEFAULT_DESCRIPTION}</p>
              )}
            </div>
          </div>
          {selectedKab === kab.name && (
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
