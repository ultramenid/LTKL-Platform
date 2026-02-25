import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapStore } from "../store/mapStore";
import BreadcrumbsComponent from "./BreadCrumbs";
import type { KabupatenFeature } from "../store/mapLayerStore";
import { loadGEEPolygonRaster, loadLayer } from "../store/mapLayerStore";
import TimeSeriesSelector from "./TimeSelector";
import { handleBreadcrumbDrill, handleHomeReset } from "../utils/mapDrilldown";

const DEFAULT_CENTER: [number, number] = [120.216667, -1.5];
const DEFAULT_ZOOM = 4;




const Map = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const { resetBreadcrumbs, setMap } = useMapStore();
  const [isMapReady, setIsMapReady] = useState(false); 

  const handleHome = () =>
    handleHomeReset(mapRef.current, resetBreadcrumbs, DEFAULT_CENTER, DEFAULT_ZOOM);

  const handleBreadcrumbClick = (level: "kabupaten" | "kecamatan" | "desa") => {
    const { breadcrumbs, updateBreadcrumb } = useMapStore.getState();
    return handleBreadcrumbDrill(mapRef.current, level, breadcrumbs, updateBreadcrumb);
  };


  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/dataviz-light/style.json?key=84THmLMIMtlrEbOF2Iup`,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 4,
    });
    
    mapRef.current = map;
    setMap(map); //  Save globally

    
    map.on("load", async () => {
      await loadGEEPolygonRaster(map);
      await loadLayer<KabupatenFeature>(map, "LTKL:kabupaten", "kabupaten-src", "kabupaten-fill");
      setIsMapReady(true);
    });

    const scale = new maplibregl.ScaleControl({
      maxWidth: 150,
      unit: "metric",
    });
    map.addControl(scale, "bottom-right");

    return () => {
      map.remove();
      mapRef.current = null;
      setIsMapReady(false);
      setMap(null);
    };
  }, [setMap]);

  return (
    <>
      <div ref={mapContainer} className="h-full w-full" />
      {/*  Time Series Selector */}
      {isMapReady && <TimeSeriesSelector map={mapRef.current} />} 
      <BreadcrumbsComponent onHome={handleHome}  handeBreadcrumbs={handleBreadcrumbClick}/>
    </>
  );
};

export default Map;
