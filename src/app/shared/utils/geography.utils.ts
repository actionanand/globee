import bbox from '@turf/bbox';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { ExploreMode, GeographyEntity } from '../../core/models/geography.models';
export const assetUrl = (path: string): string => new URL(path, document.baseURI).toString();
export const maplibreWorkerUrl = (): string => assetUrl('maplibre/maplibre-gl-worker.mjs');
export const entityMapMode = (entity: GeographyEntity): ExploreMode => {
  if (entity.specialRegion) return entity.specialRegion.mapContext;
  if (entity.type === 'india-state' || entity.type === 'india-union-territory') return 'india';
  if (entity.type === 'ocean') return 'oceans';
  if (entity.type === 'continent') return 'continents';
  return 'world';
};
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
