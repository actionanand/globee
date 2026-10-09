import { inject, Injectable } from '@angular/core';
import Fuse from 'fuse.js';
import {
  ContinentDefinition,
  GeographyEntity,
  IndiaRegionInfo,
  OceanDefinition,
  SpecialRegionDefinition,
} from '../models/geography.models';
import { CountryDataService } from './country-data.service';
export const CONTINENTS: ContinentDefinition[] = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica',
].map((name) => ({ id: name.toLowerCase().replaceAll(' ', '-'), name }));
export const OCEANS: OceanDefinition[] = [
  {
    id: 'pacific',
    name: 'Pacific Ocean',
    center: [-155, 8],
    zoom: 1.5,
    description: 'The largest ocean on Earth.',
  },
  {
    id: 'atlantic',
    name: 'Atlantic Ocean',
    center: [-35, 15],
    zoom: 1.7,
    description: 'The ocean between the Americas, Europe and Africa.',
  },
  {
    id: 'indian',
    name: 'Indian Ocean',
    center: [75, -15],
    zoom: 1.8,
    description: 'The ocean between Africa, Asia and Australia.',
  },
  {
    id: 'southern',
    name: 'Southern Ocean',
    center: [0, -62],
    zoom: 1.5,
    description: 'The ocean surrounding Antarctica.',
  },
  {
    id: 'arctic',
    name: 'Arctic Ocean',
    center: [0, 80],
    zoom: 1.7,
    description: 'The smallest and northernmost ocean.',
  },
];
export const DELHI_NCR: SpecialRegionDefinition = {
  id: 'delhi-ncr',
  name: 'Delhi NCR',
  aliases: ['NCR', 'National Capital Region'],
  center: [77.18, 28.65],
  zoom: 5.5,
  mapContext: 'india',
  focusBounds: [
    [74, 26],
    [80, 31],
  ],
  description: "Constituent areas based on NCRPB's official list.",
};
const unionTerritories = new Set([
  'Andaman & Nicobar Island',
  'Chandigarh',
  'Dadra & Nagar Havelli and Daman & Diu',
  'Delhi',
  'Jammu & Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
]);
const aliases: Record<string, string[]> = {
  'Tamil Nadu': ['Tamilnadu'],
  Puducherry: ['Pondicherry'],
  Delhi: ['NCT of Delhi', 'National Capital Territory of Delhi', 'Delhi NCT'],
  'Andaman & Nicobar Island': ['Andaman and Nicobar Islands'],
};
const indiaDisplayNames: Record<string, string> = {
  'Andaman & Nicobar Island': 'Andaman and Nicobar Islands',
  'Arunanchal Pradesh': 'Arunachal Pradesh',
  'Dadra & Nagar Havelli and Daman & Diu': 'Dadra and Nagar Haveli and Daman and Diu',
};
export const INDIA_REGIONS: IndiaRegionInfo[] = [
  'Andaman & Nicobar Island',
  'Andhra Pradesh',
  'Arunanchal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Chandigarh',
  'Dadra & Nagar Havelli and Daman & Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Himachal Pradesh',
  'Haryana',
  'Jharkhand',
  'Jammu & Kashmir',
  'Karnataka',
  'Kerala',
  'Lakshadweep',
  'Ladakh',
  'Maharashtra',
  'Meghalaya',
  'Manipur',
  'Madhya Pradesh',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Puducherry',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Tripura',
  'Telangana',
  'Uttarakhand',
  'Uttar Pradesh',
  'West Bengal',
].map((name) => ({
  name: indiaDisplayNames[name] ?? name,
  sourceName: name,
  type: unionTerritories.has(name) ? 'union-territory' : 'state',
  aliases: [name, ...(aliases[name] ?? [])].filter((alias) => alias !== indiaDisplayNames[name]),
}));
@Injectable({ providedIn: 'root' })
export class GeographySearchService {
  private readonly entities: GeographyEntity[];
  private readonly fuse: Fuse<GeographyEntity>;
  private readonly countryData = inject(CountryDataService);
  constructor() {
    const countryData = this.countryData;
    this.entities = [
      ...countryData.countries.map((country) => ({
        id: `country-${country.code}`,
        name: country.name,
        type: 'country' as const,
        searchTerms: country.capital,
        country,
      })),
      ...CONTINENTS.map((continent) => ({
        id: `continent-${continent.id}`,
        name: continent.name,
        type: 'continent' as const,
        continent,
      })),
      ...OCEANS.map((ocean) => ({
        id: `ocean-${ocean.id}`,
        name: ocean.name,
        type: 'ocean' as const,
        ocean,
        description: ocean.description,
      })),
      ...INDIA_REGIONS.map((indiaRegion) => ({
        id: `india-${indiaRegion.sourceName}`,
        name: indiaRegion.name,
        type:
          indiaRegion.type === 'state'
            ? ('india-state' as const)
            : ('india-union-territory' as const),
        searchTerms: indiaRegion.aliases,
        indiaRegion,
      })),
      {
        id: 'special-delhi-ncr',
        name: DELHI_NCR.name,
        type: 'special-region',
        searchTerms: DELHI_NCR.aliases,
        specialRegion: DELHI_NCR,
        description: DELHI_NCR.description,
      },
    ];
    this.fuse = new Fuse(this.entities, {
      keys: ['name', 'searchTerms'],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }
  search(query: string): GeographyEntity[] {
    const trimmed = query.trim();
    return trimmed
      ? this.fuse
          .search(trimmed)
          .map((result) => result.item)
          .slice(0, 8)
      : [];
  }
}
