import { readFile, writeFile } from 'node:fs/promises';

const [districtPath, indiaPath, outputPath] = process.argv.slice(2);
if (!districtPath || !indiaPath || !outputPath)
  throw new Error(
    'Usage: node scripts/extract-delhi-ncr.mjs <districts.geojson> <india-states.geojson> <output.geojson>',
  );
const normalize = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const targets = [
  ...[
    'Faridabad',
    'Gurugram',
    'Nuh',
    'Rohtak',
    'Sonipat',
    'Rewari',
    'Jhajjar',
    'Panipat',
    'Palwal',
    'Bhiwani',
    'Charkhi Dadri',
    'Mahendragarh',
    'Jind',
    'Karnal',
  ].map((name) => ({
    name,
    subregion: 'Haryana',
    aliases:
      name === 'Gurugram'
        ? ['Gurgaon']
        : name === 'Nuh'
          ? ['Mewat']
          : name === 'Sonipat'
            ? ['Sonepat']
            : name === 'Charkhi Dadri'
              ? ['Charki Dadri']
              : [],
  })),
  ...[
    'Meerut',
    'Ghaziabad',
    'Gautam Budh Nagar',
    'Bulandshahr',
    'Baghpat',
    'Hapur',
    'Shamli',
    'Muzaffarnagar',
  ].map((name) => ({
    name,
    subregion: 'Uttar Pradesh',
    aliases:
      name === 'Gautam Budh Nagar'
        ? ['Gautam Buddha Nagar']
        : name === 'Bulandshahr'
          ? ['Bulandshahar']
          : name === 'Baghpat'
            ? ['Bagpat']
            : [],
  })),
  ...['Alwar', 'Bharatpur'].map((name) => ({ name, subregion: 'Rajasthan', aliases: [] })),
];
const source = JSON.parse(await readFile(districtPath, 'utf8'));
const india = JSON.parse(await readFile(indiaPath, 'utf8'));
if (source.type !== 'FeatureCollection' || india.type !== 'FeatureCollection')
  throw new Error('Both input files must be FeatureCollections');
const values = (feature) =>
  Object.values(feature.properties ?? {})
    .filter((value) => typeof value === 'string')
    .map(normalize);
const selected = targets.map((target) => {
  const names = new Set([target.name, ...target.aliases].map(normalize));
  const state = normalize(target.subregion);
  const matches = source.features.filter((feature) => {
    const candidate = values(feature);
    return candidate.includes(state) && candidate.some((value) => names.has(value));
  });
  if (matches.length !== 1)
    throw new Error(
      `Expected exactly one match for ${target.name}, found ${matches.length}. Candidate property samples: ${JSON.stringify(matches.slice(0, 3).map((feature) => feature.properties))}`,
    );
  return {
    type: 'Feature',
    properties: {
      name: target.name,
      subregion: target.subregion,
      componentType: 'district',
      globee_ncr: true,
    },
    geometry: matches[0].geometry,
  };
});
const delhi = india.features.filter((feature) => feature.properties?.state_name === 'Delhi');
if (delhi.length !== 1)
  throw new Error(`Expected exactly one Delhi state geometry, found ${delhi.length}`);
selected.push({
  type: 'Feature',
  properties: { name: 'Delhi', subregion: 'Delhi', componentType: 'NCT', globee_ncr: true },
  geometry: delhi[0].geometry,
});
const distribution = selected.reduce(
  (counts, feature) => ({
    ...counts,
    [feature.properties.subregion]: (counts[feature.properties.subregion] ?? 0) + 1,
  }),
  {},
);
if (
  selected.length !== 25 ||
  distribution.Haryana !== 14 ||
  distribution['Uttar Pradesh'] !== 8 ||
  distribution.Rajasthan !== 2 ||
  distribution.Delhi !== 1
)
  throw new Error(`Unexpected NCR distribution: ${JSON.stringify(distribution)}`);
await writeFile(
  outputPath,
  `${JSON.stringify({ type: 'FeatureCollection', features: selected })}\n`,
);
console.log(`Wrote ${selected.length} NCR constituent features to ${outputPath}`);
