import { readFile, writeFile } from 'node:fs/promises';
import { feature as topoFeature } from 'topojson-client';

const [outputPath] = process.argv.slice(2);
if (!outputPath)
  throw new Error('Usage: node scripts/prepare-world-map.mjs <temporary-output.geojson>');
const topology = JSON.parse(
  await readFile(
    new URL('../node_modules/world-atlas/countries-50m.json', import.meta.url),
    'utf8',
  ),
);
const countries = topology.objects?.countries;
if (topology.type !== 'Topology' || !countries)
  throw new Error('world-atlas countries TopoJSON is invalid');
const converted = topoFeature(topology, countries);
if (converted.type !== 'FeatureCollection' || !converted.features.length)
  throw new Error('World conversion produced no country features');
const features = converted.features.map((feature) => ({
  ...feature,
  properties: {
    ...feature.properties,
    globee_numeric_code: String(feature.id ?? '').padStart(3, '0'),
  },
}));
if (!features.every((feature) => /^\d{3}$/.test(feature.properties.globee_numeric_code)))
  throw new Error('World conversion produced an invalid numeric country code');
await writeFile(outputPath, `${JSON.stringify({ type: 'FeatureCollection', features })}\n`);
console.log(`World features: ${features.length}`);
console.log(`Countries with numeric codes: ${features.length}`);
