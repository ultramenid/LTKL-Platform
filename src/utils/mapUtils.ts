import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import type {
  KabupatenFeature,
  KecamatanFeature,
  DesaFeature,
} from "../store/mapLayerStore";

export type AnyRegionFeature =
  | KabupatenFeature
  | KecamatanFeature
  | DesaFeature;

export const zoomToFeature = (
  map: MapLibreMap,
  feature: AnyRegionFeature
) => {
  const coords: [number, number][] = [];

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

export const zoomToMatchingFeature = (
  map: maplibregl.Map,
  sourceId: string,
  matchField: string,
  matchValue: string
) => {
  const src = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
  if (!src || !("_data" in src)) return;

  const data = (src as any)._data;
  if (!data?.features) return;

  const feature = data.features.find(
    (f: any) => f.properties[matchField] === matchValue
  );
  if (!feature || !feature.geometry) return;

  const coords: [number, number][] = [];

  if (feature.geometry.type === "Polygon") {
    feature.geometry.coordinates.forEach((ring: number[][]) => {
      ring.forEach(([lng, lat]) => {
        if (typeof lng === "number" && typeof lat === "number") {
          coords.push([lng, lat]);
        }
      });
    });
  } else if (feature.geometry.type === "MultiPolygon") {
    feature.geometry.coordinates.forEach((polygon: number[][][]) => {
      polygon.forEach((ring: number[][]) => {
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

