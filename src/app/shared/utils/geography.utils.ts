import bbox from '@turf/bbox';
import { Feature, FeatureCollection, Geometry } from 'geojson';
export const assetUrl = (path: string): string => new URL(path, document.baseURI).toString();
export const featureBounds = (
  feature: Feature<Geometry> | FeatureCollection<Geometry>,
): [[number, number], [number, number]] => {
  const [west, south, east, north] = bbox(feature);
  return [
    [west, south],
    [east, north],
  ];
};
export const normalizeName = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
