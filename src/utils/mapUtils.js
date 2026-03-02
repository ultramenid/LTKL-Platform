import maplibregl from "maplibre-gl";

// Ekstrak semua koordinat dari geometry (Polygon/MultiPolygon) sebagai array [lon, lat]
const extractCoordinates = (geometryData) => {
  const allCoordinates = [];
  
  if (geometryData.type === "Polygon") {
    geometryData.coordinates.forEach((ring) =>
      ring.forEach(([lon, lat]) => {
        if (typeof lon === "number" && typeof lat === "number") {
          allCoordinates.push([lon, lat]);
        }
      })
    );
  } else if (geometryData.type === "MultiPolygon") {
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

// Hitung bounding box dari koordinat dan animate map ke area itu (paddingPixels: pixel dari edge)
const fitBoundsToCoordinates = (mapInstance, coordinates, paddingPixels = 100) => {
  if (coordinates.length === 0) return;

  const lonValues = coordinates.map(([lon]) => lon);
  const latValues = coordinates.map(([, lat]) => lat);

  const bounds = new maplibregl.LngLatBounds(
    [Math.min(...lonValues), Math.min(...latValues)],
    [Math.max(...lonValues), Math.max(...latValues)]
  );

  mapInstance.fitBounds(bounds, { padding: paddingPixels, duration: 400 });
};

// Tunggu source data ready di map secara event-driven (lebih reliable dari setTimeout)
export const waitForSourceData = (mapInstance, sourceId) => {
  return new Promise((resolveWaiting) => {
    // Jika source sudah loaded, langsung resolve (tidak perlu tunggu event)
    if (mapInstance.isSourceLoaded(sourceId)) {
      resolveWaiting();
      return;
    }

    const onSourceDataReady = (sourceEvent) => {
      if (sourceEvent.sourceId === sourceId && sourceEvent.isSourceLoaded) {
        mapInstance.off("sourcedata", onSourceDataReady);
        resolveWaiting();
      }
    };
    mapInstance.on("sourcedata", onSourceDataReady);
  });
};

// Zoom ke feature yang punya geometry (dari GeoJSON feature object)
export const zoomToFeature = (mapInstance, featureObject) => {
  if (!featureObject?.geometry) return;
  const featureCoordinates = extractCoordinates(featureObject.geometry);
  fitBoundsToCoordinates(mapInstance, featureCoordinates, 40);
};

// Cari feature di source berdasarkan property, lalu zoom ke sana
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
