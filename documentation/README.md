# Globee

Globee is a kid-friendly, local-first geography explorer. Its first release centres on an interactive map: select a country, explore continents and oceans, or switch to India's states and Union Territories.

## Current scope

- MapLibre GL map with no hosted basemap, API key, location access, or tracking
- Local world boundaries from `world-atlas` (`countries-50m.json`)
- Local country reference data from `world-countries`
- India state/UT boundaries from `public/maps/india-states.geojson`
- Unified fuzzy search for places, capitals, continents, oceans, Indian regions, aliases, and Delhi NCR
- Responsive light/dark experience, keyboard search, reduced-motion support, and readable selection details

## Architecture

`src/app/core` contains data, search, selection, and typed geography models. `features/explore` composes the page. Reusable map and information-card components live in `shared`. Geometry is loaded on demand and retained in memory, with India loaded only for its mode or selection.

## Local-first data and privacy

The map starts with an empty local MapLibre style and bundled geometry. It does not contact a tile provider or request the learner's location. Runtime asset URLs are based on `document.baseURI`, so GitHub Pages deployment beneath `/globee/` works correctly.

## GitHub Pages

`npm run build:gh` builds with the `/globee/` base href. The Angular build copies `world-atlas/countries-50m.json` to `maps/` alongside public assets.

Future datasets should be authoritative, stored as local static assets, and documented in [geography-data.md](documentation/geography-data.md). Do not introduce unverified facts or inferred boundaries.
