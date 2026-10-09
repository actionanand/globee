# Geography data in Globee

## World boundaries

World country geometry is bundled from `world-atlas` using `countries-50m.json`. The 50m dataset is used rather than 110m so small countries remain useful when selected. `GeographyDataService` fetches it relative to `document.baseURI` and converts the TopoJSON `countries` object to GeoJSON with `topojson-client`.

The browser loads a prepared `world-countries-50m.geojson` asset. `scripts/prepare-world-map.sh` converts the source TopoJSON and uses GDAL with RFC 7946 output and dateline splitting, producing browser-safe MapLibre geometry without runtime topology repair.

## Country reference information

`world-countries` supplies local reference metadata. `CountryDataService` narrows its external record shape into Globee's `CountryInfo` model. The app displays only values present in that local data and omits unavailable values.

## India boundaries

`public/maps/india-states.geojson` is the provided Survey of India / NWDP / NWIC-derived dataset. Globee loads it without modifying coordinates and validates that it contains 36 features with a `state_name`. State/UT classification is an explicit local mapping, not a geometry inference.

## Search aliases

Supported aliases include `Tamilnadu` → Tamil Nadu, `Pondicherry` → Puducherry, Delhi aliases such as `NCT of Delhi` → Delhi, and `Andaman and Nicobar Islands` → the source feature's official label.

## Delhi NCR

Delhi NCR is a **special region**, not a state or Union Territory. Until an authoritative district-boundary GeoJSON is available, its search result focuses the map around Delhi/NCR and explains that it spans Delhi and neighbouring areas. It does not draw or imply an NCR polygon. A future authoritative file can be added at `public/maps/delhi-ncr.geojson` as a dedicated overlay.

## Oceans

Oceans use curated educational centres and zoom levels only. There are no fabricated ocean polygons. Authoritative geometry can later be attached to the existing ocean entity definitions.

`scripts/prepare-oceans.sh` prepares a local `oceans-50m.geojson` from Natural Earth 5.1.2 marine polygons. It preserves seven source pieces, groups them into Arctic, Southern, Atlantic, Pacific, and Indian educational oceans, then uses GDAL RFC 7946/dateline processing for browser-safe geometry.

## Delhi NCR

Delhi NCR constituent geography is derived from NCRPB's official constituent list and the NWDP District Boundary dataset. `delhi-ncr.geojson` is a derived Globee overlay, not an official NCRPB boundary shapefile. All browser runtime assets are local; source downloads occur only during manual preparation.

## MapLibre worker assets

MapLibre GL JS v6 uses a separate ESM worker. Angular copies `maplibre-gl-worker.mjs` and its sibling `maplibre-gl-shared.mjs` into `maplibre/`. Before the first map is created, Globee calls `setWorkerUrl()` with a URL resolved relative to `document.baseURI`. This supports both local development and the GitHub Pages `/globee/` base path.
