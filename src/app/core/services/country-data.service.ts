import { Injectable } from '@angular/core';
import countries from 'world-countries';
import { CountryInfo } from '../models/geography.models';
interface RawCountry {
  cca3?: string;
  ccn3?: string;
  name?: { common?: string; official?: string };
  capital?: string[];
  region?: string;
  subregion?: string;
  languages?: Record<string, string>;
  currencies?: Record<string, { name?: string }>;
  borders?: string[];
  area?: number;
  flag?: string;
}
const educationalContinent = (region?: string, subregion?: string): string => {
  if (region === 'Americas')
    return subregion === 'South America' ? 'South America' : 'North America';
  if (region === 'Antarctic') return 'Antarctica';
  return region || 'Other';
};
@Injectable({ providedIn: 'root' })
export class CountryDataService {
  readonly countries: CountryInfo[] = (countries as RawCountry[])
    .map((item) => ({
      code: item.cca3 ?? '',
      numericCode: item.ccn3,
      name: item.name?.common ?? '',
      officialName: item.name?.official,
      capital: item.capital ?? [],
      continent: educationalContinent(item.region, item.subregion),
      subregion: item.subregion,
      languages: Object.values(item.languages ?? {}),
      currencies: Object.values(item.currencies ?? {})
        .map((currency) => currency.name)
        .filter((name): name is string => Boolean(name)),
      neighbours: item.borders ?? [],
      areaKm2: item.area,
      flag: item.flag,
    }))
    .filter((item) => Boolean(item.code && item.name));
  private readonly byCode = new Map(this.countries.map((country) => [country.code, country]));
  private readonly byNumericCode = new Map(
    this.countries
      .filter((country) => country.numericCode)
      .map((country) => [country.numericCode!, country]),
  );
  findByCode(code: string): CountryInfo | undefined {
    return this.byCode.get(code);
  }
  findByNumericCode(code: string | number): CountryInfo | undefined {
    return this.byNumericCode.get(String(code).padStart(3, '0'));
  }
}
