import maplibregl from "maplibre-gl";

// Extract semua koordinat dari geometry (Polygon atau MultiPolygon)
// GeometryData: {type: 'Polygon', coordinates: [...]} atau {type: 'MultiPolygon', coordinates: [...]}
// Return: array of [longitude, latitude] pairs
const extractCoordinates = (geometryData) => {
  const allCoordinates = [];
  
  if (geometryData.type === "Polygon") {
    // Polygon: loop ring (outer boundary + holes)
    geometryData.coordinates.forEach((ring) =>
      ring.forEach(([lon, lat]) => {
        if (typeof lon === "number" && typeof lat === "number") {
          allCoordinates.push([lon, lat]);
        }
      })
    );
  } else if (geometryData.type === "MultiPolygon") {
    // MultiPolygon: multiple polygons, loop semuanya
    geometryData.coordinates.forEach((polygon) =>
      polygon.forEach((ring) =>
        ring.forEach(([lon, lat]) => {
          if (typeof lon === "number" && typeof lat === "number") {
            allCoordinates.push([lon, lat]);
          }
        })
      )
    );
  }
  
  return allCoordinates;
};

// Hitung bounding box dari koordinat list dan animate map ke area itu
// paddingPixels: jarak dari edge map (pixel)
const fitBoundsToCoordinates = (mapInstance, coordinates, paddingPixels = 100) => {
  if (coordinates.length === 0) return;

  // Pisahkan lon/lat untuk hitung min/max bounds
  const lonValues = coordinates.map(([lon]) => lon);
  const latValues = coordinates.map(([, lat]) => lat);

  // Buat bounding box dari ekstrim koordinat
  const bounds = new maplibregl.LngLatBounds(
    [Math.min(...lonValues), Math.min(...latValues)],
    [Math.max(...lonValues), Math.max(...latValues)]
  );

  // Animate map zoom ke bounds dengan padding
  mapInstance.fitBounds(bounds, { padding: paddingPixels, duration: 400 });
};

// tunggu sampai source data ready di map (event-driven, lebih reliable daripada timeout)
// Bermanfaat untuk: zoom setelah data load, atau execute action pas data siap
export const waitForSourceData = (mapInstance, sourceId) => {
  return new Promise((resolveWaiting) => {
    const onSourceDataReady = (sourceEvent) => {
      if (sourceEvent.sourceId === sourceId && sourceEvent.isSourceLoaded) {
        mapInstance.off("sourcedata", onSourceDataReady);
        resolveWaiting();
      }
    };
    mapInstance.on("sourcedata", onSourceDataReady);
  });
};

// Zoom ke feature berdasarkan feature object (harus punya geometry)
// Parameter: mapInstance, featureObject = {geometry: {...}, properties: {...}}
export const zoomToFeature = (mapInstance, featureObject) => {
  if (!featureObject?.geometry) return;
  const featureCoordinates = extractCoordinates(featureObject.geometry);
  fitBoundsToCoordinates(mapInstance, featureCoordinates, 40);
};

// Zoom ke feature dengan search di source berdasarkan property
// Contoh: zoomToMatchingFeature(map, 'kabupaten-src', 'kab', 'Bantul')
// → search feature dengan property.kab === 'Bantul', lalu zoom ke sana
export const zoomToMatchingFeature = (mapInstance, sourceId, propertyName, propertyValue) => {
  const source = mapInstance.getSource(sourceId);
  if (!source || !("_data" in source)) return;

  const geojsonCollection = source._data;
  if (!geojsonCollection?.features) return;

  // Cari feature yang property-nya match
  const targetFeature = geojsonCollection.features.find(
    (feature) => feature.properties[propertyName] === propertyValue
  );
  if (!targetFeature?.geometry) return;

  const featureCoordinates = extractCoordinates(targetFeature.geometry);
  fitBoundsToCoordinates(mapInstance, featureCoordinates, 100);
};
