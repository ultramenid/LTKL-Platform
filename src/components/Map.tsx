import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapStore } from "../store/mapStore";
import BreadcrumbsComponent from "./BreadCrumbs";
import type { KabupatenFeature, KecamatanFeature, DesaFeature } from "../store/mapLayerStore";
import { loadGEEPolygonRaster, loadLayer } from "../store/mapLayerStore";
import TimeSeriesSelector from "./TimeSelector";

const DEFAULT_CENTER: [number, number] = [120.216667, -1.5];
const DEFAULT_ZOOM = 4;




const Map = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const {  resetBreadcrumbs, setMap } = useMapStore();
  const [isMapReady, setIsMapReady] = useState(false); 

  
  
  const handleHome = async () => {
    const map = mapRef.current;
    if (!map) return;
    // Remove all lower-level layers before reloading
    ["desa-fill", "kecamatan-fill", "kabupaten-fill"].forEach((id) => {
      const highlightLayerId = id + "-highlight";
      if (map.getLayer(highlightLayerId)) map.removeLayer(highlightLayerId);
      if (map.getLayer(id)) map.removeLayer(id);
      const sourceId = id.replace("-fill", "-src");
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });
    resetBreadcrumbs();
    map.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
    await loadLayer<KabupatenFeature>(map, "LTKL:kabupaten", "kabupaten-src", "kabupaten-fill");
    await loadGEEPolygonRaster(map);
  };

  //  Drill up logic (clicking breadcrumb)
 const handleBreadcrumbClick = async (level: "kabupaten" | "kecamatan" | "desa") => {
  const map = mapRef.current;
  if (!map) return;

  const { breadcrumbs, updateBreadcrumb } = useMapStore.getState();

  const zoomToMatchingFeature = (map: maplibregl.Map, sourceId: string, matchField: string,matchValue: string) => {
  const src = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
  if (!src || !("_data" in src)) return;

  const data = (src as any)._data;
  if (!data?.features) return;

  const feature = data.features.find((f: any) => f.properties[matchField] === matchValue);
  if (!feature || !feature.geometry) return;

  const coords: [number, number][] = [];
  if (feature.geometry.type === "Polygon") {
    feature.geometry.coordinates.forEach((ring: number[][]) => {
      ring.forEach(([lng, lat]) => {
        if (typeof lng === "number" && typeof lat === "number") coords.push([lng, lat]);
      });
    });
  } else if (feature.geometry.type === "MultiPolygon") {
    feature.geometry.coordinates.forEach((polygon: number[][][]) => {
      polygon.forEach((ring: number[][]) => {
        ring.forEach(([lng, lat]) => {
          if (typeof lng === "number" && typeof lat === "number") coords.push([lng, lat]);
        });
      });
    });
  }

  if (coords.length === 0) return;

  const lons = coords.map(([lng]) => lng);
  const lats = coords.map(([_, lat]) => lat);
  const bounds = new maplibregl.LngLatBounds(
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)]
  );

  // Add padding for nicer zoom
  map.fitBounds(bounds, { padding: 100, duration: 400 });
};


  //  Drill up logic (clicking breadcrumb)
  if (level === "kabupaten" && breadcrumbs.kab) {
    updateBreadcrumb("kecamatan", undefined);
    updateBreadcrumb("desa", undefined);
    // Remove deeper layers (kecamatan, desa)
    ["desa-fill", "kecamatan-fill"].forEach(id => map.getLayer(id) && map.removeLayer(id));
    ["desa-src", "kecamatan-src"].forEach(id => map.getSource(id) && map.removeSource(id));

    // load kabupaten layer with filter
    await loadLayer<KabupatenFeature>( map, "LTKL:kabupaten","zoomkabupaten-src", "zoomkabupaten-fill",`kab='${breadcrumbs.kab}'`);

    //Zoom to this kabupaten polygon
    zoomToMatchingFeature(map, "zoomkabupaten-src", "kab", breadcrumbs.kab);

     // load kabupaten layer with filter from gee api
    await loadGEEPolygonRaster(map, { kab: breadcrumbs.kab });

    // Show children of kabupaten polygons
    await loadLayer<KabupatenFeature>(map,"LTKL:kecamatan","kabupaten-src","kabupaten-fill",`kab='${breadcrumbs.kab}'`);

    
    if (map.getLayer("zoomkabupaten-fill")) map.removeLayer("zoomkabupaten-fill");
    
  } 

  else if (level === "kecamatan" && breadcrumbs.kab && breadcrumbs.kec) {
    updateBreadcrumb("desa", undefined);
    if (map.getLayer("desa-fill")) map.removeLayer("desa-fill");
    if (map.getSource("desa-src")) map.removeSource("desa-src");
    
    //
    await loadLayer<KecamatanFeature>( map, "LTKL:kecamatan", "zoomkecamatan-src", "zoomkecamatan-fill", `kec='${breadcrumbs.kec}'`);

    // Zoom to this kecamatan polygon
    zoomToMatchingFeature(map, "zoomkecamatan-src", "kec", breadcrumbs.kec);

    // Load kecamatan layer with filter from gee api
    await loadGEEPolygonRaster(map, { kec: breadcrumbs.kec });

    // Show children of kecamatan polygons
    await loadLayer<KecamatanFeature>( map, "LTKL:desa", "kecamatan-src", "kecamatan-fill", `kec='${breadcrumbs.kec}'`);
    if (map.getLayer("zoomkecamatan-fill")) map.removeLayer("zoomkecamatan-fill");


  } 

  else if (level === "desa" && breadcrumbs.kab && breadcrumbs.kec && breadcrumbs.des) {
   
    // Load desa layer with filter from gee api
    await loadGEEPolygonRaster(map, { des: breadcrumbs.des });
    // Show children of desa polygons
    await loadLayer<DesaFeature>( map,"LTKL:desa", "desa-src", "desa-fill", `kab='${breadcrumbs.kab}' AND kec='${breadcrumbs.kec}'`);
    // Zoom to this desa polygon
    zoomToMatchingFeature(map, "desa-src", "des", breadcrumbs.des);
  }
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
    setMap(map); // 🧠 Save globally

    
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
