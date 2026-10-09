import { TestBed } from '@angular/core/testing';
import { CountryDataService } from './country-data.service';
describe('CountryDataService', () => {
  const service = (): CountryDataService => TestBed.inject(CountryDataService);
  beforeEach(() => TestBed.configureTestingModule({}));
  it('resolves stable ISO country codes', () => {
    expect(service().findByCode('JPN')?.name).toBe('Japan');
    expect(service().findByCode('IND')?.name).toBe('India');
    expect(service().findByCode('SGP')?.name).toBe('Singapore');
    expect(service().findByCode('USA')?.name).toBe('United States');
    expect(service().findByCode('XXX')).toBeUndefined();
  });
  it('links Australia and Antarctica to their stable country records', () => {
    expect(service().findByCode('AUS')?.continent).toBe('Oceania');
    expect(service().findByCode('ATA')?.name).toBe('Antarctica');
  });
});
