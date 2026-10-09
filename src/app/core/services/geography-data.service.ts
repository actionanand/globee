import { Injectable } from '@angular/core';
import { feature as topoFeature } from 'topojson-client';
import { GeoFeatureCollection } from '../models/geography.models';
import { assetUrl } from '../../shared/utils/geography.utils';
@Injectable({ providedIn: 'root' })
export class GeographyDataService {
  private world?: Promise<GeoFeatureCollection>;
  private india?: Promise<GeoFeatureCollection>;
  loadWorld(): Promise<GeoFeatureCollection> {
    return (this.world ??= this.fetchWorld());
  }
  loadIndia(): Promise<GeoFeatureCollection> {
    return (this.india ??= this.fetchIndia());
  }
  private async fetchWorld(): Promise<GeoFeatureCollection> {
    const response = await fetch(assetUrl('maps/countries-50m.json'));
    if (!response.ok) throw new Error('World map data is unavailable');
    const topology = (await response.json()) as Parameters<typeof topoFeature>[0];
    const object = topology.objects['countries'];
    if (!object) throw new Error('World map data is invalid');
    return topoFeature(topology, object) as unknown as GeoFeatureCollection;
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
}
