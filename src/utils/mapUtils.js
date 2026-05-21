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

const SOURCE_DATA_TIMEOUT_MS = 8000;

// Wait for source data to be ready in map using event-driven approach (more reliable than setTimeout)
export const waitForSourceData = (mapInstance, sourceId, signal) => {
  return new Promise((resolveWaiting, rejectWaiting) => {
    if (signal?.aborted) {
      rejectWaiting(new DOMException('Aborted', 'AbortError'));
      return;
    }

    if (!mapInstance.getSource(sourceId) || mapInstance.isSourceLoaded(sourceId)) {
      resolveWaiting();
      return;
    }

    let settled = false;

    const cleanup = () => {
      mapInstance.off('sourcedata', onSourceDataReady);
      mapInstance.off('styledata', onStyleDataChanged);
      signal?.removeEventListener('abort', onAbort);
      clearTimeout(timeoutId);
    };

    const resolve = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolveWaiting();
    };

    const reject = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      rejectWaiting(error);
    };

    function onSourceDataReady(sourceEvent) {
      if (sourceEvent.sourceId === sourceId && sourceEvent.isSourceLoaded) {
        resolve();
      }
    }

    function onStyleDataChanged() {
      if (!mapInstance.getSource(sourceId)) {
        reject(new DOMException('Source removed', 'AbortError'));
      }
    }

    function onAbort() {
      reject(new DOMException('Aborted', 'AbortError'));
    }

    const timeoutId = setTimeout(() => {
      reject(new DOMException('Source data timed out', 'AbortError'));
    }, SOURCE_DATA_TIMEOUT_MS);

    mapInstance.on('sourcedata', onSourceDataReady);
    mapInstance.on('styledata', onStyleDataChanged);
    signal?.addEventListener('abort', onAbort, { once: true });
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

  // Resize first so browser recalculates container dimensions before fitBounds;
  // without this, maps inside scrollable layouts may miscalculate zoom
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

export const findFeatureInCollection = (geojsonCollection, propertyName, propertyValue) => {
  if (!geojsonCollection?.features) return null;
  return (
    geojsonCollection.features.find((feature) => feature.properties?.[propertyName] === propertyValue) ?? null
  );
};

// Find a feature in a GeoJSON collection by property, then zoom to it
export const zoomToMatchingFeature = (mapInstance, geojsonCollection, propertyName, propertyValue) => {
  const targetFeature = findFeatureInCollection(geojsonCollection, propertyName, propertyValue);
  if (!targetFeature?.geometry) return;

  const featureCoordinates = extractCoordinates(targetFeature.geometry);
  fitBoundsToCoordinates(mapInstance, featureCoordinates, 100);
};
