import fs from 'node:fs';

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/prepare-oceans.mjs <input.geojson> <output.geojson>');
}

const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

if (source.type !== 'FeatureCollection' || !Array.isArray(source.features)) {
  throw new Error('Expected a GeoJSON FeatureCollection');
}

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function canonicalOcean(feature) {
  const props = feature.properties ?? {};

  // Natural Earth name_en is the most useful educational name.
  const english = normalize(props.name_en);
  const sourceName = normalize(props.name);

  const value = english || sourceName;

  switch (value) {
    case 'arctic ocean':
      return 'Arctic Ocean';

    case 'southern ocean':
      return 'Southern Ocean';

    case 'north atlantic ocean':
    case 'south atlantic ocean':
    case 'atlantic ocean':
      return 'Atlantic Ocean';

    case 'north pacific ocean':
    case 'south pacific ocean':
    case 'pacific ocean':
      return 'Pacific Ocean';

    case 'indian ocean':
      return 'Indian Ocean';

    default:
      return undefined;
  }
}

const oceanFeatures = source.features
  .filter((feature) => normalize(feature.properties?.featurecla) === 'ocean')
  .map((feature) => {
    const canonical = canonicalOcean(feature);

    if (!canonical) {
      throw new Error(
        `Unrecognized ocean feature: ${JSON.stringify({
          featurecla: feature.properties?.featurecla,
          name: feature.properties?.name,
          name_en: feature.properties?.name_en,
        })}`,
      );
    }

    return {
      type: 'Feature',
      properties: {
        globee_ocean: canonical,
        source_name: feature.properties?.name_en ?? feature.properties?.name ?? canonical,
      },
      geometry: feature.geometry,
    };
  });

const groups = new Set(oceanFeatures.map((feature) => feature.properties.globee_ocean));

const expectedGroups = new Set([
  'Arctic Ocean',
  'Southern Ocean',
  'Atlantic Ocean',
  'Pacific Ocean',
  'Indian Ocean',
]);

if (oceanFeatures.length !== 7) {
  throw new Error(`Expected 7 Natural Earth ocean pieces; got ${oceanFeatures.length}`);
}

if (groups.size !== expectedGroups.size || [...expectedGroups].some((name) => !groups.has(name))) {
  throw new Error(`Expected 5 canonical oceans; got: ${[...groups].sort().join(', ')}`);
}

const output = {
  type: 'FeatureCollection',
  features: oceanFeatures,
};

fs.writeFileSync(outputPath, `${JSON.stringify(output)}\n`);

console.log(`Created ${outputPath}`);
console.log(`Ocean polygon pieces: ${oceanFeatures.length}`);
console.log(`Educational ocean groups: ${groups.size}`);

for (const name of [...groups].sort()) {
  const count = oceanFeatures.filter((feature) => feature.properties.globee_ocean === name).length;

  console.log(`- ${name}: ${count} piece${count === 1 ? '' : 's'}`);
}
