import maplibregl from "maplibre-gl";

export const zoomToFeature = (map, feature) => {
  const coords = [];

  // Extract coordinates dari geometry (support Polygon dan MultiPolygon)
  if (feature.geometry.type === "Polygon") {
    feature.geometry.coordinates.forEach((ring) =>
      ring.forEach(([lon, lat]) => coords.push([lon, lat]))
    );
  } else if (feature.geometry.type === "MultiPolygon") {
    feature.geometry.coordinates.forEach((polygon) =>
      polygon.forEach((ring) =>
        ring.forEach(([lon, lat]) => coords.push([lon, lat]))
      )
    );
  }

  if (coords.length === 0) return;

  // Hitung bounds dari coordinates
  const lons = coords.map(([lon]) => lon);
  const lats = coords.map(([, lat]) => lat);

  map.fitBounds(
    [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ],
    { padding: 40, duration: 1000 }
  );
};

export const zoomToMatchingFeature = (map, sourceId, matchField, matchValue) => {
  const src = map.getSource(sourceId);
  if (!src || !("_data" in src)) return;

  const data = src._data;
  if (!data?.features) return;

  // Cari feature yang properties-nya cocok dengan filter
  const feature = data.features.find(
    (foundFeature) => foundFeature.properties[matchField] === matchValue
  );
  if (!feature || !feature.geometry) return;

  const coords = [];

  // Extract coordinates + validasi tipe data
  if (feature.geometry.type === "Polygon") {
    feature.geometry.coordinates.forEach((ring) => {
      ring.forEach(([lng, lat]) => {
        if (typeof lng === "number" && typeof lat === "number") {
          coords.push([lng, lat]);
        }
      });
    });
  } else if (feature.geometry.type === "MultiPolygon") {
    feature.geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach(([lng, lat]) => {
          if (typeof lng === "number" && typeof lat === "number") {
            coords.push([lng, lat]);
          }
        });
      });
    });
  }

  if (coords.length === 0) return;

  const lons = coords.map(([lng]) => lng);
  const lats = coords.map(([, lat]) => lat);

  const bounds = new maplibregl.LngLatBounds(
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)]
  );

  map.fitBounds(bounds, { padding: 100, duration: 400 });
};
