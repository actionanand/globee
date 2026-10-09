import { Feature, FeatureCollection, Geometry } from 'geojson';

export type GeographyEntityType =
  'country' | 'continent' | 'ocean' | 'india-state' | 'india-union-territory' | 'special-region';
export type ExploreMode = 'world' | 'continents' | 'oceans' | 'india';
export interface CountryInfo {
  code: string;
  numericCode?: string;
  name: string;
  officialName?: string;
  capital: string[];
  continent: string;
  subregion?: string;
  languages: string[];
  currencies: string[];
  neighbours: string[];
  areaKm2?: number;
  flag?: string;
}
export interface IndiaRegionInfo {
  name: string;
  type: 'state' | 'union-territory';
  aliases?: string[];
  capital?: string;
  languages?: string[];
}
export interface OceanDefinition {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
  description: string;
}
export interface SpecialRegionDefinition {
  id: string;
  name: string;
  aliases: string[];
  center: [number, number];
  zoom: number;
  description: string;
}
export interface ContinentDefinition {
  id: string;
  name: string;
}
export interface GeographyEntity {
  id: string;
  name: string;
  type: GeographyEntityType;
  searchTerms?: string[];
  description?: string;
  country?: CountryInfo;
  indiaRegion?: IndiaRegionInfo;
  ocean?: OceanDefinition;
  continent?: ContinentDefinition;
  specialRegion?: SpecialRegionDefinition;
}
export type GeoFeatureCollection = FeatureCollection<Geometry, Record<string, unknown>>;
export type GeoFeature = Feature<Geometry, Record<string, unknown>>;
