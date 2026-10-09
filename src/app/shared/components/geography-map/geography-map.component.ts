import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
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
import { INDIA_REGIONS, OCEANS } from '../../../core/services/geography-search.service';
import { GeographySelectionService } from '../../../core/services/geography-selection.service';
import { featureBounds, maplibreWorkerUrl } from '../../utils/geography.utils';

@Component({
  selector: 'app-geography-map',
  template:
    '<div #map class="map" aria-label="Interactive geography map"></div><button class="reset" type="button" (click)="resetView()" aria-label="Reset map view">Reset view</button>@if (loading() || errorMessage() || hoveredName()) { <div class="map-status" aria-live="polite">@if (loading()) { Preparing the map… } @else if (errorMessage()) { {{ errorMessage() }} } @else if (hoveredName()) { {{ hoveredName() }} }</div> }',
  styleUrl: './geography-map.component.scss',
})
export class GeographyMapComponent implements AfterViewInit {
  readonly mode = input.required<ExploreMode>();
  readonly preview = input<GeographyEntity | null>(null);
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('map');
  private readonly data = inject(GeographyDataService);
  private readonly countries = inject(CountryDataService);
  private readonly selection = inject(GeographySelectionService);
  private readonly destroyRef = inject(DestroyRef);
  private map?: Map;
  private resizeObserver?: ResizeObserver;
  private activeCollection?: GeoFeatureCollection;
  private ncrCollection?: GeoFeatureCollection;
  private activeKind: 'world' | 'india' = 'world';
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly hoveredName = signal<string | null>(null);
  constructor() {
    effect(() => {
      const mode = this.mode();
      if (this.map) void this.showMode(mode);
    });
    effect(() => {
      const entity = this.selection.selected();
      if (!entity || !this.map) return;
      if (entity.specialRegion?.mapContext === 'india' && this.activeKind === 'india') {
        void this.showDelhiNcr(entity);
        return;
      }
      this.focusEntity(entity);
    });
    effect(() => {
      const preview = this.preview();
      if (!this.map) return;
      if (preview) this.highlight(preview);
      else this.restoreSelectionHighlight();
    });
  }
  ngAfterViewInit(): void {
    maplibregl.setWorkerUrl(maplibreWorkerUrl());
    const map = new maplibregl.Map({
      container: this.host().nativeElement,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'water', type: 'background', paint: { 'background-color': '#bfe7ef' } }],
      },
      center: [10, 18],
      zoom: 1.2,
      renderWorldCopies: false,
      attributionControl: false,
    });
    this.map = map;
    this.resizeObserver = new ResizeObserver(() => map.resize());
    this.resizeObserver.observe(this.host().nativeElement);
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('load', () => void this.showMode(this.mode()));
    map.on('error', (event) => {
      console.error('Globee MapLibre error', event.error);
    });
    this.destroyRef.onDestroy(() => {
      this.detachLayerHandlers();
      this.resizeObserver?.disconnect();
      this.map?.remove();
    });
  }
  private async showMode(mode: ExploreMode): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.hoveredName.set(null);
    try {
      if (mode === 'india') {
        this.activeCollection = await this.data.loadIndia();
        this.activeKind = 'india';
        this.setData('india', this.activeCollection, '#74c69d');
        this.map?.fitBounds(
          [
            [67, 6],
            [98, 37],
          ],
          { padding: 32, maxZoom: 4.4, duration: this.duration() },
        );
        if (this.selection.selected()?.specialRegion?.mapContext === 'india')
          await this.addDelhiNcrData();
      } else {
        const world = await this.data.loadWorld();
        this.activeCollection = this.enrichWorld(world);
        this.activeKind = 'world';
        this.setData(
          'world',
          this.activeCollection,
          mode === 'continents' ? '#a7d8a8' : '#8ed1b2',
          mode === 'continents',
        );
        this.map?.fitBounds(
          [
            [-180, -60],
            [180, 84],
          ],
          { padding: 20, maxZoom: 2.1, duration: this.duration() },
        );
        if (mode === 'oceans') await this.addOceanData();
      }
      const selected = this.selection.selected();
      if (selected && this.isCompatible(selected, mode)) this.focusEntity(selected);
      this.loading.set(false);
    } catch (error: unknown) {
      console.error('Globee map data failed to load', error);
      this.activeCollection = undefined;
      this.loading.set(false);
      this.errorMessage.set("Map data couldn't be displayed. Please reload and try again.");
    }
  }
  private setData(
    kind: 'world' | 'india',
    collection: GeoFeatureCollection,
    color: string,
    continents = false,
  ): void {
    const map = this.map;
    if (!map) return;
    this.detachLayerHandlers();
    for (const id of [
      'ncr-fill',
      'ncr-border',
      'ocean-fill',
      'ocean-selected',
      'geo-fill',
      'geo-selected',
    ])
      if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource('delhi-ncr')) map.removeSource('delhi-ncr');
    if (map.getSource('oceans')) map.removeSource('oceans');
    if (map.getSource('geography')) map.removeSource('geography');
    map.addSource('geography', { type: 'geojson', data: collection });
    map.addLayer({
      id: 'geo-fill',
      type: 'fill',
      source: 'geography',
      paint: {
        'fill-color': continents
          ? [
              'match',
              ['get', 'globee_continent'],
              'Africa',
              '#e9a85d',
              'Asia',
              '#e77e72',
              'Europe',
              '#8ca7e8',
              'North America',
              '#72b7a1',
              'South America',
              '#b78bd0',
              'Oceania',
              '#e6c85c',
              'Antarctica',
              '#c4d0d9',
              color,
            ]
          : color,
        'fill-opacity': 0.9,
        'fill-outline-color': '#276749',
      },
    });
    map.addLayer({
      id: 'geo-selected',
      type: 'fill',
      source: 'geography',
      paint: { 'fill-color': '#f5c84c', 'fill-opacity': 0.72, 'fill-outline-color': '#153d31' },
      filter: ['==', ['get', '_selected'], true],
    });
    map.on('mousemove', 'geo-fill', this.handleMouseMove);
    map.on('mouseleave', 'geo-fill', this.handleMouseLeave);
    map.on('click', 'geo-fill', this.handleClick);
  }
  private async addOceanData(): Promise<void> {
    const map = this.map;
    if (!map) return;
    const oceans = await this.data.loadOceans();
    map.addSource('oceans', { type: 'geojson', data: oceans });
    map.addLayer(
      {
        id: 'ocean-fill',
        type: 'fill',
        source: 'oceans',
        paint: {
          'fill-color': [
            'match',
            ['get', 'globee_ocean'],
            'Pacific Ocean',
            '#4ea5d9',
            'Atlantic Ocean',
            '#609bd8',
            'Indian Ocean',
            '#638eca',
            'Southern Ocean',
            '#7baed1',
            'Arctic Ocean',
            '#97c9dc',
            '#609bd8',
          ],
          'fill-opacity': 0.22,
        },
      },
      'geo-fill',
    );
    map.addLayer(
      {
        id: 'ocean-selected',
        type: 'fill',
        source: 'oceans',
        paint: { 'fill-color': '#168a9a', 'fill-opacity': 0.42 },
        filter: ['==', ['get', 'globee_ocean'], ''],
      },
      'geo-fill',
    );
    map.on('mousemove', 'ocean-fill', this.handleOceanMove);
    map.on('mouseleave', 'ocean-fill', this.handleMouseLeave);
    map.on('click', 'ocean-fill', this.handleOceanClick);
  }
  private async addDelhiNcrData(): Promise<void> {
    const map = this.map;
    if (!map) return;
    if (map.getSource('delhi-ncr')) return;
    this.ncrCollection = await this.data.loadDelhiNcr();
    map.addSource('delhi-ncr', { type: 'geojson', data: this.ncrCollection });
    map.addLayer({
      id: 'ncr-fill',
      type: 'fill',
      source: 'delhi-ncr',
      paint: {
        'fill-color': [
          'match',
          ['get', 'subregion'],
          'Delhi',
          '#efc94c',
          'Haryana',
          '#d89377',
          'Uttar Pradesh',
          '#7da9d8',
          'Rajasthan',
          '#a88ac7',
          '#88b88a',
        ],
        'fill-opacity': 0.72,
        'fill-outline-color': '#3b4f4a',
      },
    });
    map.addLayer({
      id: 'ncr-border',
      type: 'line',
      source: 'delhi-ncr',
      paint: { 'line-color': '#3b4f4a', 'line-width': 1 },
    });
    map.on('mousemove', 'ncr-fill', this.handleNcrMove);
    map.on('mouseleave', 'ncr-fill', this.handleMouseLeave);
    map.on('click', 'ncr-fill', this.handleNcrClick);
  }
  private async showDelhiNcr(entity: GeographyEntity): Promise<void> {
    try {
      await this.addDelhiNcrData();
      this.focusEntity(entity);
    } catch (error: unknown) {
      console.error('Globee Delhi NCR map data failed to load', error);
      this.errorMessage.set("Map data couldn't be displayed. Please reload and try again.");
    }
  }
  private readonly handleMouseMove = (event: { features?: MapGeoJSONFeature[] }): void => {
    const feature = event.features?.[0];
    if (feature) {
      this.hoveredName.set(this.featureName(this.activeKind, feature));
      this.map?.getCanvas().style.setProperty('cursor', 'pointer');
    }
  };
  private readonly handleMouseLeave = (): void => {
    this.hoveredName.set(null);
    if (this.map) this.map.getCanvas().style.cursor = '';
  };
  private readonly handleClick = (event: { features?: MapGeoJSONFeature[] }): void =>
    this.selectFeature(this.activeKind, event.features?.[0]);
  private detachLayerHandlers(): void {
    if (!this.map) return;
    this.map.off('mousemove', 'geo-fill', this.handleMouseMove);
    this.map.off('mouseleave', 'geo-fill', this.handleMouseLeave);
    this.map.off('click', 'geo-fill', this.handleClick);
    this.map.off('mousemove', 'ocean-fill', this.handleOceanMove);
    this.map.off('mouseleave', 'ocean-fill', this.handleMouseLeave);
    this.map.off('click', 'ocean-fill', this.handleOceanClick);
    this.map.off('mousemove', 'ncr-fill', this.handleNcrMove);
    this.map.off('mouseleave', 'ncr-fill', this.handleMouseLeave);
    this.map.off('click', 'ncr-fill', this.handleNcrClick);
  }
  private featureName(kind: 'world' | 'india', feature: MapGeoJSONFeature): string {
    if (kind === 'world') return String(feature.properties?.['globee_country_name'] ?? 'Country');
    return (
      INDIA_REGIONS.find(
        (region) => region.sourceName === String(feature.properties?.['state_name'] ?? ''),
      )?.name ?? 'Indian region'
    );
  }
  private readonly handleOceanMove = (event: { features?: MapGeoJSONFeature[] }): void => {
    const name = String(event.features?.[0]?.properties?.['globee_ocean'] ?? 'Ocean');
    this.hoveredName.set(name);
    this.map?.getCanvas().style.setProperty('cursor', 'pointer');
  };
  private readonly handleOceanClick = (event: { features?: MapGeoJSONFeature[] }): void => {
    const name = String(event.features?.[0]?.properties?.['globee_ocean'] ?? '');
    const ocean = OCEANS.find((item) => item.name === name);
    if (ocean)
      this.selection.select({
        id: `ocean-${ocean.id}`,
        name: ocean.name,
        type: 'ocean',
        ocean,
        description: ocean.description,
      });
  };
  private readonly handleNcrMove = (event: { features?: MapGeoJSONFeature[] }): void => {
    const feature = event.features?.[0];
    this.hoveredName.set(
      `${String(feature?.properties?.['name'] ?? 'NCR constituent')} — ${String(feature?.properties?.['subregion'] ?? '')}`,
    );
    this.map?.getCanvas().style.setProperty('cursor', 'pointer');
  };
  private readonly handleNcrClick = (): void => {
    /* NCR district selection intentionally retains the Delhi NCR card. */
  };
  private selectFeature(kind: 'world' | 'india', feature?: MapGeoJSONFeature): void {
    if (!feature) return;
    if (kind === 'world') {
      const country = this.countries.findByCode(
        String(feature.properties?.['globee_country_code'] ?? ''),
      );
      if (country)
        this.selection.select({
          id: `country-${country.code}`,
          name: country.name,
          type: 'country',
          country,
        });
      return;
    }
    const sourceName = String(feature.properties?.['state_name'] ?? '');
    const indiaRegion = INDIA_REGIONS.find((region) => region.sourceName === sourceName);
    if (indiaRegion)
      this.selection.select({
        id: `india-${sourceName}`,
        name: indiaRegion.name,
        type: indiaRegion.type === 'state' ? 'india-state' : 'india-union-territory',
        indiaRegion,
      });
  }
  private focusEntity(entity: GeographyEntity): void {
    const map = this.map;
    if (!map) return;
    if (entity.ocean) {
      if (map.getLayer('ocean-selected'))
        map.setFilter('ocean-selected', ['==', ['get', 'globee_ocean'], entity.ocean.name]);
      map.flyTo({
        center: entity.ocean.center,
        zoom: entity.ocean.zoom,
        duration: this.duration(),
      });
      return;
    }
    if (entity.specialRegion) {
      if (this.ncrCollection)
        map.fitBounds(featureBounds(this.ncrCollection), {
          padding: 44,
          maxZoom: 7,
          duration: this.duration(),
        });
      else if (entity.specialRegion.focusBounds)
        map.fitBounds(entity.specialRegion.focusBounds, {
          padding: 48,
          maxZoom: 5.8,
          duration: this.duration(),
        });
      else
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
          ? feature.properties['globee_country_code'] === entity.country?.code
          : entity.indiaRegion
            ? feature.properties['state_name'] === entity.indiaRegion.sourceName
            : entity.continent
              ? feature.properties['globee_continent'] === this.continentMapValue(entity)
              : false,
      ) ?? [];
    if (features.length) {
      this.highlight(entity);
      const collection: GeoFeatureCollection = { type: 'FeatureCollection', features };
      const bounds = featureBounds(collection);
      map.fitBounds(bounds, {
        padding: 56,
        maxZoom: entity.type === 'india-state' || entity.type === 'india-union-territory' ? 7 : 6,
        duration: this.duration(),
      });
    }
  }
  private highlight(entity: GeographyEntity): void {
    if (!this.map) return;
    if (entity.ocean) {
      if (this.map.getLayer('ocean-selected'))
        this.map.setFilter('ocean-selected', ['==', ['get', 'globee_ocean'], entity.ocean.name]);
      return;
    }
    if (!this.map.getLayer('geo-selected')) return;
    if (entity.indiaRegion) {
      this.map.setFilter('geo-selected', [
        '==',
        ['get', 'state_name'],
        entity.indiaRegion.sourceName,
      ]);
      return;
    }
    if (entity.country) {
      this.map.setFilter('geo-selected', [
        '==',
        ['get', 'globee_country_code'],
        entity.country.code,
      ]);
      return;
    }
    if (entity.continent) {
      const countryCodes = this.countries.countries
        .filter((country) => country.continent === this.continentMapValue(entity))
        .map((country) => country.code);
      this.map.setFilter('geo-selected', [
        'in',
        ['get', 'globee_country_code'],
        ['literal', countryCodes],
      ]);
    }
  }
  private continentMapValue(entity: GeographyEntity): string {
    return entity.continent?.mapValue ?? entity.continent?.name ?? '';
  }
  private restoreSelectionHighlight(): void {
    const selected = this.selection.selected();
    if (selected) {
      this.highlight(selected);
      return;
    }
    if (this.map?.getLayer('geo-selected'))
      this.map.setFilter('geo-selected', ['==', ['get', '_selected'], true]);
    if (this.map?.getLayer('ocean-selected'))
      this.map.setFilter('ocean-selected', ['==', ['get', 'globee_ocean'], '']);
  }
  resetView(): void {
    this.selection.clear();
    void this.showMode(this.mode());
  }
  private enrichWorld(collection: GeoFeatureCollection): GeoFeatureCollection {
    return {
      type: 'FeatureCollection',
      features: collection.features.map((feature) => {
        const country = this.countries.findByNumericCode(
          String(feature.properties['globee_numeric_code'] ?? ''),
        );
        return {
          ...feature,
          properties: {
            ...feature.properties,
            globee_country_code: country?.code ?? '',
            globee_country_name: country?.name ?? '',
            globee_continent: country?.continent ?? 'Other',
          },
        };
      }),
    };
  }
  private isCompatible(entity: GeographyEntity, mode: ExploreMode): boolean {
    if (entity.specialRegion)
      return entity.specialRegion.mapContext === (mode === 'india' ? 'india' : 'world');
    return mode === 'india'
      ? entity.type === 'india-state' || entity.type === 'india-union-territory'
      : entity.type === 'country' || entity.type === 'continent' || entity.type === 'ocean';
  }
  private duration(): number {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500;
  }
}
