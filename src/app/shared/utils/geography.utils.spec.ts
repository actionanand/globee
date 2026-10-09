import { Feature } from 'geojson';
import { featureBounds } from './geography.utils';
describe('featureBounds', () => {
  it('calculates Polygon bounds', () => {
    const feature: Feature = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [1, 2],
            [3, 2],
            [3, 4],
            [1, 2],
          ],
        ],
      },
    };
    expect(featureBounds(feature)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
  it('calculates MultiPolygon bounds', () => {
    const feature: Feature = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [1, 2],
              [3, 2],
              [3, 4],
              [1, 2],
            ],
          ],
          [
            [
              [5, 6],
              [7, 6],
              [7, 8],
              [5, 6],
            ],
          ],
        ],
      },
    };
    expect(featureBounds(feature)).toEqual([
      [1, 2],
      [7, 8],
    ]);
  });
});
