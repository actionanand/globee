import { GeographyEntity } from '../../core/models/geography.models';
import { entityMapMode } from './geography.utils';

describe('entityMapMode', () => {
  it('uses India context for Delhi NCR without making it a Union Territory', () => {
    const entity: GeographyEntity = {
      id: 'ncr',
      name: 'Delhi NCR',
      type: 'special-region',
      specialRegion: {
        id: 'ncr',
        name: 'Delhi NCR',
        aliases: ['NCR'],
        center: [77, 28],
        zoom: 5.5,
        mapContext: 'india',
        description: 'Context only',
      },
    };
    expect(entityMapMode(entity)).toBe('india');
    expect(entity.type).toBe('special-region');
  });
  it('keeps standard entity map modes', () => {
    expect(entityMapMode({ id: 'india', name: 'India', type: 'country' })).toBe('world');
    expect(entityMapMode({ id: 'karnataka', name: 'Karnataka', type: 'india-state' })).toBe(
      'india',
    );
  });
});
