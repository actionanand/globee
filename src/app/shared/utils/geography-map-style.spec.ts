import {
  CONTINENT_FILL_COLORS,
  SELECTED_FILL_COLOR,
  continentCountryCodes,
  continentMapValue,
  countryForWorldNumericCode,
} from './geography-map-style';
import { CONTINENTS } from '../../core/services/geography-search.service';
import { CountryInfo } from '../../core/models/geography.models';

describe('geography map styling and continent membership', () => {
  const countries: CountryInfo[] = [
    {
      code: 'AUS',
      name: 'Australia',
      capital: [],
      continent: 'Oceania',
      languages: [],
      currencies: [],
      neighbours: [],
    },
    {
      code: 'ATA',
      name: 'Antarctica',
      capital: [],
      continent: 'Antarctica',
      languages: [],
      currencies: [],
      neighbours: [],
    },
    {
      code: 'BVT',
      name: 'Bouvet Island',
      capital: [],
      continent: 'Antarctica',
      languages: [],
      currencies: [],
      neighbours: [],
    },
  ];

  it('uses Oceania map membership for the Oceania / Australia label', () => {
    const oceania = CONTINENTS.find((continent) => continent.id === 'oceania');
    expect(oceania?.name).toBe('Oceania / Australia');
    expect(continentMapValue(oceania!)).toBe('Oceania');
    expect(continentCountryCodes(oceania!, countries)).toContain('AUS');
  });

  it('limits Antarctica to its actual country feature', () => {
    const antarctica = CONTINENTS.find((continent) => continent.id === 'antarctica');
    expect(continentCountryCodes(antarctica!, countries)).toEqual(['ATA']);
  });

  it('keeps normal continent fills distinct from the selected fill', () => {
    expect(Object.values(CONTINENT_FILL_COLORS)).not.toContain(SELECTED_FILL_COLOR);
  });

  it('never links unknown world geometry through numeric code 000', () => {
    expect(countryForWorldNumericCode('000', () => countries[0])).toBeUndefined();
    expect(countryForWorldNumericCode('036', () => countries[0])).toEqual(countries[0]);
  });
});
