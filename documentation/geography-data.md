# Geography data in Globee

## World boundaries

World country geometry starts with `world-atlas` `countries-50m.json`. The 50m dataset is used rather than 110m so small countries remain useful when selected. Manual preparation converts the TopoJSON with `topojson-client`, then uses GDAL RFC 7946 output and `-wrapdateline` to create `public/maps/world-countries-50m.geojson`.

The browser loads that prepared GeoJSON directly relative to `document.baseURI`; it does not run TopoJSON conversion or geometry rewinding at runtime. The validation script permits only legitimate dateline and polar ring closures, while rejecting ordinary antimeridian jumps.

## Country reference information

`world-countries` supplies local reference metadata. `CountryDataService` narrows its external record shape into Globee's `CountryInfo` model. The app displays only values present in that local data and omits unavailable values.

## India boundaries

`public/maps/india-states.geojson` is the provided Survey of India / NWDP / NWIC-derived dataset. Globee loads it without modifying coordinates and validates that it contains 36 features with a `state_name`. State/UT classification is an explicit local mapping, not a geometry inference.

## Search aliases

Supported aliases include `Tamilnadu` → Tamil Nadu, `Pondicherry` → Puducherry, Delhi aliases such as `NCT of Delhi` → Delhi, and `Andaman and Nicobar Islands` → the source feature's official label.

## Delhi NCR

Delhi NCR is a **special region**, not a state or Union Territory. Its 25-feature local overlay is derived from the NCRPB official constituent list, NWDP District Boundary data, and the whole Delhi state geometry: Delhi (1), Haryana (14), Rajasthan (2), and Uttar Pradesh (8). It is a contextual overlay rather than an official NCRPB boundary shapefile. The underlying India states remain selectable as administrative context; highlighting Haryana, for example, does not imply all of Haryana belongs to NCR.

## Oceans

Oceans use curated educational centres and zoom levels only. There are no fabricated ocean polygons. Authoritative geometry can later be attached to the existing ocean entity definitions.

`scripts/prepare-oceans.sh` prepares a local `oceans-50m.geojson` from Natural Earth 5.1.2 marine polygons. It preserves seven source pieces, groups them into Arctic, Southern, Atlantic, Pacific, and Indian educational oceans, then uses GDAL RFC 7946/dateline processing for browser-safe geometry.

## MapLibre worker assets

MapLibre GL JS v6 uses a separate ESM worker. Angular copies `maplibre-gl-worker.mjs` and its sibling `maplibre-gl-shared.mjs` into `maplibre/`. Before the first map is created, Globee calls `setWorkerUrl()` with a URL resolved relative to `document.baseURI`. This supports both local development and the GitHub Pages `/globee/` base path.
