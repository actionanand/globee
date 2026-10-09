import { TestBed } from '@angular/core/testing';
import { GeographySearchService } from './geography-search.service';
describe('GeographySearchService', () => {
  const service = (): GeographySearchService => TestBed.inject(GeographySearchService);
  beforeEach(() => TestBed.configureTestingModule({}));
  it('finds countries by name and capital', () => {
    expect(service().search('Singapore')[0]?.name).toBe('Singapore');
    expect(service().search('Tokyo')[0]?.name).toBe('Japan');
  });
  it('finds continents, oceans and Indian regions', () => {
    expect(service().search('Asia')[0]?.type).toBe('continent');
    expect(service().search('Indian Ocean')[0]?.type).toBe('ocean');
    expect(service().search('Karnataka')[0]?.type).toBe('india-state');
    expect(service().search('Delhi')[0]?.type).toBe('india-union-territory');
  });
  it('keeps Oceania / Australia discoverable as a continent without hiding Australia', () => {
    expect(service().search('Oceania')[0]).toMatchObject({
      name: 'Oceania / Australia',
      type: 'continent',
    });
    expect(service().search('Australia')[0]).toMatchObject({
      name: 'Australia',
      type: 'country',
    });
  });
  it('resolves documented aliases', () => {
    expect(service().search('Tamilnadu')[0]?.name).toBe('Tamil Nadu');
    expect(service().search('Pondicherry')[0]?.name).toBe('Puducherry');
    expect(service().search('NCT of Delhi')[0]?.name).toBe('Delhi');
  });
  it('keeps Delhi NCR separate from Delhi', () => {
    expect(service().search('Delhi NCR')[0]?.type).toBe('special-region');
  });
  it('does not return a fuzzy result for unknown text', () => {
    expect(service().search('zzzznotaplace').length).toBe(0);
  });
});
