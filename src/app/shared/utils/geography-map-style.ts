import { ContinentDefinition, CountryInfo } from '../../core/models/geography.models';

export const SELECTED_FILL_COLOR = '#f5c84c';

export const CONTINENT_FILL_COLORS: Record<string, string> = {
  Africa: '#c2695f',
  Asia: '#e77e72',
  Europe: '#8ca7e8',
  'North America': '#72b7a1',
  'South America': '#b78bd0',
  Oceania: '#4faeba',
  Antarctica: '#c4d0d9',
};

export const continentMapValue = (continent: ContinentDefinition): string =>
  continent.mapValue ?? continent.name;

export const continentCountryCodes = (
  continent: ContinentDefinition,
  countries: readonly CountryInfo[],
): string[] => {
  const mapValue = continentMapValue(continent);
  if (mapValue === 'Antarctica') return ['ATA'];
  return countries
    .filter((country) => country.continent === mapValue)
    .map((country) => country.code);
};

export const countryForWorldNumericCode = (
  numericCode: string,
  findByNumericCode: (code: string) => CountryInfo | undefined,
): CountryInfo | undefined => (numericCode === '000' ? undefined : findByNumericCode(numericCode));
