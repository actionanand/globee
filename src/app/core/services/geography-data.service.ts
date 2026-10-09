import { Injectable } from '@angular/core';
import { GeoFeatureCollection } from '../models/geography.models';
import { assetUrl } from '../../shared/utils/geography.utils';
@Injectable({ providedIn: 'root' })
export class GeographyDataService {
  private world?: Promise<GeoFeatureCollection>;
  private india?: Promise<GeoFeatureCollection>;
  private oceans?: Promise<GeoFeatureCollection>;
  private delhiNcr?: Promise<GeoFeatureCollection>;
  loadWorld(): Promise<GeoFeatureCollection> {
    return (this.world ??= this.fetchWorld());
  }
  loadIndia(): Promise<GeoFeatureCollection> {
    return (this.india ??= this.fetchIndia());
  }
  loadOceans(): Promise<GeoFeatureCollection> {
    return (this.oceans ??= this.fetchOceans());
  }
  loadDelhiNcr(): Promise<GeoFeatureCollection> {
    return (this.delhiNcr ??= this.fetchDelhiNcr());
  }
  private async fetchWorld(): Promise<GeoFeatureCollection> {
    const response = await fetch(assetUrl('maps/world-countries-50m.geojson'));
    if (!response.ok) throw new Error('World map data is unavailable');
    const collection = (await response.json()) as GeoFeatureCollection;
    const validGeometry = collection.features.every(
      (feature) => feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon',
    );
    const validCodes = collection.features.every((feature) =>
      /^\d{3}$/.test(String(feature.properties['globee_numeric_code'] ?? '')),
    );
    if (
      collection.type !== 'FeatureCollection' ||
      !collection.features.length ||
      !validGeometry ||
      !validCodes
    )
      throw new Error('World map data is invalid');
    return collection;
  }
  private async fetchIndia(): Promise<GeoFeatureCollection> {
    const response = await fetch(assetUrl('maps/india-states.geojson'));
    if (!response.ok) throw new Error('India map data is unavailable');
    const collection = (await response.json()) as GeoFeatureCollection;
    if (
      collection.type !== 'FeatureCollection' ||
      collection.features.length !== 36 ||
      !collection.features.every((item) => typeof item.properties['state_name'] === 'string')
    )
      throw new Error('India map data is invalid');
    return collection;
  }
  private async fetchOceans(): Promise<GeoFeatureCollection> {
    const response = await fetch(assetUrl('maps/oceans-50m.geojson'));
    if (!response.ok) throw new Error('Ocean map data is unavailable');
    const collection = (await response.json()) as GeoFeatureCollection;
    const groups = new Set(
      collection.features.map((feature) => feature.properties['globee_ocean']),
    );
    const validGeometry = collection.features.every(
      (feature) => feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon',
    );
    if (
      collection.type !== 'FeatureCollection' ||
      !collection.features.length ||
      !validGeometry ||
      groups.size !== 5
    )
      throw new Error('Ocean map data is invalid');
    return collection;
  }
  private async fetchDelhiNcr(): Promise<GeoFeatureCollection> {
    const response = await fetch(assetUrl('maps/delhi-ncr.geojson'));
    if (!response.ok) throw new Error('Delhi NCR map data is unavailable');
    const collection = (await response.json()) as GeoFeatureCollection;
    const distribution = collection.features.reduce<Record<string, number>>(
      (counts, feature) => ({
        ...counts,
        [String(feature.properties['subregion'] ?? '')]:
          (counts[String(feature.properties['subregion'] ?? '')] ?? 0) + 1,
      }),
      {},
    );
    const valid = collection.features.every(
      (feature) =>
        (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') &&
        typeof feature.properties['name'] === 'string' &&
        typeof feature.properties['componentType'] === 'string' &&
        feature.properties['globee_ncr'] === true,
    );
    if (
      collection.type !== 'FeatureCollection' ||
      collection.features.length !== 25 ||
      !valid ||
      distribution['Delhi'] !== 1 ||
      distribution['Haryana'] !== 14 ||
      distribution['Uttar Pradesh'] !== 8 ||
      distribution['Rajasthan'] !== 2
    )
      throw new Error('Delhi NCR map data is invalid');
    return collection;
  }
}
