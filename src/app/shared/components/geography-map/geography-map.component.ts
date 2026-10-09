import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import * as maplibregl from 'maplibre-gl';
import type { Map, MapGeoJSONFeature } from 'maplibre-gl';
import {
  ExploreMode,
  GeoFeatureCollection,
  GeographyEntity,
} from '../../../core/models/geography.models';
import { CountryDataService } from '../../../core/services/country-data.service';
import { GeographyDataService } from '../../../core/services/geography-data.service';
import { INDIA_REGIONS } from '../../../core/services/geography-search.service';
import { GeographySelectionService } from '../../../core/services/geography-selection.service';
import { featureBounds } from '../../utils/geography.utils';

@Component({
  selector: 'app-geography-map',
  template: '<div #map class="map" aria-label="Interactive geography map"></div>',
  styleUrl: './geography-map.component.scss',
})
export class GeographyMapComponent implements AfterViewInit {
  readonly mode = input.required<ExploreMode>();
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('map');
  private readonly data = inject(GeographyDataService);
  private readonly countries = inject(CountryDataService);
  private readonly selection = inject(GeographySelectionService);
  private readonly destroyRef = inject(DestroyRef);
  private map?: Map;
  private activeCollection?: GeoFeatureCollection;
  constructor() {
    effect(() => {
      const mode = this.mode();
      if (this.map) void this.showMode(mode);
    });
    effect(() => {
      const entity = this.selection.selected();
      if (entity && this.map) this.focusEntity(entity);
    });
  }
  ngAfterViewInit(): void {
    const map = new maplibregl.Map({
      container: this.host().nativeElement,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'water', type: 'background', paint: { 'background-color': '#bfe7ef' } }],
      },
      center: [10, 18],
      zoom: 1.2,
      attributionControl: false,
    });
    this.map = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('load', () => void this.showMode(this.mode()));
    this.destroyRef.onDestroy(() => this.map?.remove());
  }
  private async showMode(mode: ExploreMode): Promise<void> {
    try {
      if (mode === 'india') {
        this.activeCollection = await this.data.loadIndia();
        this.setData('india', this.activeCollection, '#74c69d');
        this.map?.fitBounds(
          [
            [67, 6],
            [98, 37],
          ],
          { padding: 32, maxZoom: 4.4, duration: this.duration() },
        );
      } else {
        this.activeCollection = await this.data.loadWorld();
        this.setData('world', this.activeCollection, mode === 'continents' ? '#a7d8a8' : '#8ed1b2');
        this.map?.fitBounds(
          [
            [-180, -60],
            [180, 84],
          ],
          { padding: 20, maxZoom: 2.1, duration: this.duration() },
        );
      }
      const selected = this.selection.selected();
      if (selected) this.focusEntity(selected);
    } catch {
      this.activeCollection = undefined;
    }
  }
  private setData(kind: 'world' | 'india', collection: GeoFeatureCollection, color: string): void {
    const map = this.map;
    if (!map) return;
    for (const id of ['geo-fill', 'geo-line', 'geo-hover'])
      if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource('geography')) map.removeSource('geography');
    map.addSource('geography', { type: 'geojson', data: collection });
    map.addLayer({
      id: 'geo-fill',
      type: 'fill',
      source: 'geography',
      paint: { 'fill-color': color, 'fill-opacity': 0.9 },
    });
    map.addLayer({
      id: 'geo-line',
      type: 'line',
      source: 'geography',
      paint: { 'line-color': '#276749', 'line-width': 0.7 },
    });
    map.addLayer({
      id: 'geo-hover',
      type: 'line',
      source: 'geography',
      paint: { 'line-color': '#153d31', 'line-width': 3 },
      filter: ['==', ['get', '_selected'], true],
    });
    map.on('mousemove', 'geo-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'geo-fill', () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('click', 'geo-fill', (event) => this.selectFeature(kind, event.features?.[0]));
  }
  private selectFeature(kind: 'world' | 'india', feature?: MapGeoJSONFeature): void {
    if (!feature) return;
    if (kind === 'world') {
      const country = this.countries.findByNumericCode(String(feature.id ?? ''));
      if (country)
        this.selection.select({
          id: `country-${country.code}`,
          name: country.name,
          type: 'country',
          country,
        });
      return;
    }
    const name = String(feature.properties?.['state_name'] ?? '');
    const indiaRegion = INDIA_REGIONS.find((region) => region.name === name);
    if (indiaRegion)
      this.selection.select({
        id: `india-${name}`,
        name,
        type: indiaRegion.type === 'state' ? 'india-state' : 'india-union-territory',
        indiaRegion,
      });
  }
  private focusEntity(entity: GeographyEntity): void {
    const map = this.map;
    if (!map) return;
    if (entity.ocean) {
      map.flyTo({
        center: entity.ocean.center,
        zoom: entity.ocean.zoom,
        duration: this.duration(),
      });
      return;
    }
    if (entity.specialRegion) {
      map.flyTo({
        center: entity.specialRegion.center,
        zoom: entity.specialRegion.zoom,
        duration: this.duration(),
      });
      return;
    }
    const features =
      this.activeCollection?.features.filter((feature) =>
        entity.country
          ? this.countries.findByNumericCode(String(feature.id ?? ''))?.code ===
            entity.country?.code
          : entity.indiaRegion
            ? feature.properties['state_name'] === entity.indiaRegion.name
            : entity.continent
              ? this.countries.findByNumericCode(String(feature.id ?? ''))?.continent ===
                entity.continent?.name
              : false,
      ) ?? [];
    if (features.length) {
      this.highlight(entity, features);
      const collection: GeoFeatureCollection = { type: 'FeatureCollection', features };
      const bounds = featureBounds(collection);
      map.fitBounds(bounds, {
        padding: 56,
        maxZoom: entity.type === 'india-state' || entity.type === 'india-union-territory' ? 7 : 6,
        duration: this.duration(),
      });
    }
  }
  private highlight(entity: GeographyEntity, features: GeoFeatureCollection['features']): void {
    if (!this.map?.getLayer('geo-hover')) return;
    if (entity.indiaRegion) {
      this.map.setFilter('geo-hover', ['==', ['get', 'state_name'], entity.indiaRegion.name]);
      return;
    }
    const ids = features
      .map((feature) => feature.id)
      .filter((id): id is string | number => id !== undefined);
    this.map.setFilter('geo-hover', ['in', ['id'], ['literal', ids]]);
  }
  private duration(): number {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500;
  }
}
