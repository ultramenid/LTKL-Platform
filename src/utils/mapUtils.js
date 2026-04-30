import maplibregl from 'maplibre-gl';

// Extract all coordinates from geometry (Polygon/MultiPolygon) as [lon, lat] array
const extractCoordinates = (geometryData) => {
  const allCoordinates = [];

  if (geometryData.type === 'Polygon') {
    geometryData.coordinates.forEach((ring) =>
      ring.forEach(([lon, lat]) => {
        if (typeof lon === 'number' && typeof lat === 'number') {
          allCoordinates.push([lon, lat]);
        }
      }),
    );
  } else if (geometryData.type === 'MultiPolygon') {
    geometryData.coordinates.forEach((polygon) =>
      polygon.forEach((ring) =>
        ring.forEach(([lon, lat]) => {
          if (typeof lon === 'number' && typeof lat === 'number') {
            allCoordinates.push([lon, lat]);
          }
        }),
      ),
    );
  }

  return allCoordinates;
};

// Calculate bounding box from coordinates and animate map to that area (paddingPixels: pixel from edge)
const fitBoundsToCoordinates = (mapInstance, coordinates, paddingPixels = 100) => {
  if (coordinates.length === 0) return;

  const lonValues = coordinates.map(([lon]) => lon);
  const latValues = coordinates.map(([, lat]) => lat);

  const bounds = new maplibregl.LngLatBounds(
    [Math.min(...lonValues), Math.min(...latValues)],
    [Math.max(...lonValues), Math.max(...latValues)],
  );

  mapInstance.fitBounds(bounds, { padding: paddingPixels, duration: 400 });
};

// Wait for source data to be ready in map using event-driven approach (more reliable than setTimeout)
export const waitForSourceData = (mapInstance, sourceId) => {
  return new Promise((resolveWaiting) => {
    // If source is already loaded, resolve immediately
    if (mapInstance.isSourceLoaded(sourceId)) {
      resolveWaiting();
      return;
    }

    const onSourceDataReady = (sourceEvent) => {
      if (sourceEvent.sourceId === sourceId && sourceEvent.isSourceLoaded) {
        mapInstance.off('sourcedata', onSourceDataReady);
        resolveWaiting();
      }
    };
    mapInstance.on('sourcedata', onSourceDataReady);
  });
};

// Zoom to all features in a GeoJSON FeatureCollection — calculates combined bounds of all features
// (More accurate than zoomToFeature if a kabupaten consists of multiple separate polygons)
export const zoomToCollection = (mapInstance, geojsonCollection, paddingPixels = 60) => {
  if (!geojsonCollection?.features?.length) return;

  const allCoordinates = [];
  geojsonCollection.features.forEach((feature) => {
    if (feature?.geometry) {
      allCoordinates.push(...extractCoordinates(feature.geometry));
    }
  });

  // Force resize first so container dimensions are calculated by browser
  // before fitBounds is called (important for maps inside scrollable layouts)
  try {
    mapInstance.resize();
  } catch {
    /* skip */
  }

  // resize() called first so browser recalculates container dimensions
  // before fitBounds; without this, maps inside scrollable layouts may mis-calculate zoom
  try {
    mapInstance.resize();
  } catch {
    /* skip */
  }
  // requestAnimationFrame ensures resize has finished processing before fitBounds is called
  requestAnimationFrame(() => {
    fitBoundsToCoordinates(mapInstance, allCoordinates, paddingPixels);
  });
};

// Zoom to a feature that has geometry (from GeoJSON feature object)
export const zoomToFeature = (mapInstance, featureObject) => {
  if (!featureObject?.geometry) return;
  const featureCoordinates = extractCoordinates(featureObject.geometry);
  fitBoundsToCoordinates(mapInstance, featureCoordinates, 40);
};

// Find a feature in a source by property, then zoom to it
export const zoomToMatchingFeature = (mapInstance, sourceId, propertyName, propertyValue) => {
  const source = mapInstance.getSource(sourceId);
  if (!source || !('_data' in source)) return;

  const geojsonCollection = source._data;
  if (!geojsonCollection?.features) return;

  // Find feature matching the property
  const targetFeature = geojsonCollection.features.find(
    (feature) => feature.properties[propertyName] === propertyValue,
  );
  if (!targetFeature?.geometry) return;

  const featureCoordinates = extractCoordinates(targetFeature.geometry);
  fitBoundsToCoordinates(mapInstance, featureCoordinates, 100);
};
