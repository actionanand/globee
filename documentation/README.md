# Globee

Globee is a kid-friendly, local-first geography explorer. Its first release centres on an interactive map: select a country, explore continents and oceans, or switch to India's states and Union Territories.

## Current scope

- MapLibre GL map with no hosted basemap, API key, location access, or tracking
- Local prepared world boundaries from `public/maps/world-countries-50m.geojson`
- Local country reference data from `world-countries`
- India state/UT boundaries from `public/maps/india-states.geojson`
- Unified fuzzy search for places, capitals, continents, oceans, Indian regions, aliases, and Delhi NCR
- Responsive light/dark experience, keyboard search, reduced-motion support, and readable selection details

## Architecture

`src/app/core` contains data, search, selection, and typed geography models. `features/explore` composes the page. Reusable map and information-card components live in `shared`. Geometry is loaded on demand and retained in memory, with India loaded only for its mode or selection. A mode reset increments a scene revision so MapLibre reconstructs the active local scene from the same source of truth.

## Local-first data and privacy

The map starts with an empty local MapLibre style and bundled geometry. It does not contact a tile provider or request the learner's location. Runtime asset URLs are based on `document.baseURI`, so GitHub Pages deployment beneath `/globee/` works correctly.

## GitHub Pages

`npm run build:gh` builds with the `/globee/` base href. Angular copies the prepared local map assets and MapLibre worker modules alongside the application.

Future datasets should be authoritative, stored as local static assets, and documented in [geography-data.md](geography-data.md). Do not introduce unverified facts or inferred boundaries.

## Explorer modes and local map architecture

Globee provides World, Continents, Oceans, India, and Delhi NCR special-region views through a unified search. MapLibre GL JS renders only local static data, with no hosted tiles. Its v6 worker modules are copied during the Angular build and configured using a `document.baseURI`-relative worker URL.

The world source begins as the `world-atlas` TopoJSON, is manually prepared with `topojson-client`, then processed by GDAL with RFC 7946 output and `-wrapdateline`. The resulting prepared GeoJSON in `public/maps/` is the runtime map source; the browser does not run TopoJSON conversion or geometry rewinding. Enriched stable country properties drive click selection rather than MapLibre's internal feature IDs.

| Runtime data         | Source                                | Form                                 |
| -------------------- | ------------------------------------- | ------------------------------------ |
| World countries      | world-atlas 2.0.2 / Natural Earth     | Prepared local GeoJSON runtime asset |
| Oceans               | Natural Earth 5.1.2 marine polygons   | Derived local five-ocean asset       |
| India states/UTs     | NWDP / Survey of India State Boundary | Local GeoJSON                        |
| Delhi NCR membership | NCR Planning Board                    | Official constituent list            |
| Delhi NCR districts  | NWDP District Boundary                | Derived local overlay                |

Preparation scripts live in `scripts/`. They are intentionally run manually so downloaded source data can be inspected before a derived local asset is added. Delhi NCR is a Globee-derived constituent overlay, not an NCRPB boundary shapefile.
