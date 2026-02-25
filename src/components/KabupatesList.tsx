import { useEffect, useState } from "react";
import { useMapStore } from "../store/mapStore";
import { loadLayer, loadGEEPolygonRaster } from "../store/mapLayerStore";
import { zoomToFeature } from "../utils/mapUtils";
import type { KecamatanFeature, KabupatenFeature } from "../store/mapLayerStore";

export function KabupatenCard() {
  const { map, updateBreadcrumb } = useMapStore();
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedKab, setSelectedKab] = useState<string | null>(null);

  useEffect(() => {
    if (map?.isStyleLoaded()) setIsMapReady(true);
    else map?.on("load", () => setIsMapReady(true));
  }, [map]);

  const kabupatens = [
    { name: "Sintang", role: "Ketua Umum", logoUrl: "/logo/sintang.png", description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium." },
    { name: "Siak", role: "Wakil Ketua Umum", logoUrl: "/logo/siak.webp", description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium." },
    { name: "Gorontalo", role: "Sekretaris Jenderal", logoUrl: "/logo/gorontalo.png", description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium." },
    { name: "Bone Bolango", role: "Ketua Program Unit Perencanaan", logoUrl: "/logo/bonelango.png", description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium." },
    { name: "Sanggau", role: "Ketua Program Unit Kebijakan dan Peraturan", logoUrl: "/logo/sanggau.png", description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium." },
    { name: "Musi Banyuasin", role: "Ketua Program Unit Kerjasama", logoUrl: "/logo/musibanyuasin.png", description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium." },
    { name: "Aceh Tamiang", role: "Ketua Program Unit Kerjasama Multipihak", logoUrl: "/logo/acehtamiang.png", description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium." },
    { name: "Sigi", role: "Ketua Program Unit Data, Informasi & Komunikasi ", logoUrl: "/logo/sigi.png", description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium." },
    { name: "Kapuas Hulu", role: "Ketua Program Unit Inovasi & Investasi", logoUrl: "/logo/kapuashulu.png", description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium." },
    // etc...
  ];

  const handleKabupatenClick = async (kabName: string) => {
    if (!map) return console.warn("⚠️ Map not ready");
        setSelectedKab(kabName);
        updateBreadcrumb("kabupaten", kabName);
        updateBreadcrumb("kecamatan", undefined);
        updateBreadcrumb("desa", undefined);
    
        // 1️⃣ Fetch the feature geometry for the selected kabupaten
        const url = `https://aws.simontini.id/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=LTKL:kabupaten&outputFormat=application/json&CQL_FILTER=kab='${kabName}'`;
        const res = await fetch(url);
        const geojson = await res.json();

        if (!geojson.features || geojson.features.length === 0) {
          console.warn(`⚠️ No geometry found for ${kabName}`);
          return;
        }

        const feature = geojson.features[0] as KabupatenFeature;
        // Zoom to kabupaten and load its raster
        zoomToFeature(map, feature);
        // Load GEE raster for the selected kabupaten
        await loadGEEPolygonRaster(map, { kab: kabName });
    
        //  Load kecamatan layer
        await loadLayer<KecamatanFeature>(
          map,
          "LTKL:kecamatan",
          "kecamatan-src",
          "kecamatan-fill",
          `kab='${kabName}'`,
          ["kabupaten-fill"]
        );
  };

  if (!isMapReady)
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

  return (
    <>
      {kabupatens.map((kab) => (
        <div key={kab.name} className={`border-[#134e4a]/50 border-b ${selectedKab === kab.name ? 'bg-[#f0fdfa]' : ''}`}>
          <div
            onClick={() => {
              setSelectedKab(selectedKab === kab.name ? null : kab.name);
              handleKabupatenClick(kab.name);
            }}
            className="flex flex-col items-center justify-center shadow-[#5eead4] cursor-pointer w-full hover:bg-[#e0f7f4] transition-all duration-300 ease-in-out px-4 py-2"
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
                <p className="text-xs">{kab.description}</p>
              )}
            </div>
          </div>
          {selectedKab === kab.name && (
            <div className="bg-gradient-to-b from-teal-50 to-white px-4 py-4">
              <div className="space-y-3">
                <p className="text-xs text-gray-700">{kab.description}</p>
                <button className="w-full px-4 py-2 bg-teal-700 text-white rounded hover:bg-teal-700 transition text-sm font-semibold cursor-pointer">
                  Lihat detail kabupaten
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
