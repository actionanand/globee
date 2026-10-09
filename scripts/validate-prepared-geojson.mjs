import { readFile } from 'node:fs/promises';

const [path, kind] = process.argv.slice(2);
if (!path || !['world', 'oceans'].includes(kind))
  throw new Error('Usage: node scripts/validate-prepared-geojson.mjs <file> <world|oceans>');
const collection = JSON.parse(await readFile(path, 'utf8'));
if (collection.type !== 'FeatureCollection' || !collection.features?.length)
  throw new Error('Expected a non-empty FeatureCollection');
const positions = (coordinates) =>
  typeof coordinates[0] === 'number' ? [coordinates] : coordinates.flatMap(positions);
const rings = (geometry) =>
  geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
for (const feature of collection.features) {
  if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type))
    throw new Error('Only Polygon or MultiPolygon geometry is allowed');
  if (kind === 'world' && !/^\d{3}$/.test(String(feature.properties?.globee_numeric_code ?? '')))
    throw new Error('World feature missing globee_numeric_code');
  for (const [longitude, latitude] of positions(feature.geometry.coordinates))
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90)
      throw new Error(`Invalid coordinate ${longitude},${latitude}`);
  for (const ring of rings(feature.geometry))
    for (let index = 1; index < ring.length; index += 1)
      if (Math.abs(ring[index][0] - ring[index - 1][0]) > 180)
        throw new Error('Prepared geometry contains an antimeridian segment jump');
}
if (
  kind === 'oceans' &&
  new Set(collection.features.map((feature) => feature.properties?.globee_ocean)).size !== 5
)
  throw new Error('Expected exactly five ocean groups');
console.log(`Validated ${collection.features.length} ${kind} features: ${path}`);
