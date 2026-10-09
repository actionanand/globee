# Globee Geographic Map Data

## India

**File:** `public/maps/india-states.geojson`  
**Format:** GeoJSON FeatureCollection  
**CRS:** EPSG:4326 / WGS84  
**Features:** 36 total — 28 states and 8 Union Territories  
**Properties:** `state_name`, `stcode`  
**Checked-in size:** approximately 3.0 MB, pretty-printed  
**Inspected extent:** approximately `68.17751, 6.75595` to `97.41290, 37.08814`

The source dataset is **State Boundary**, produced by Survey of India and distributed through the National Water Data Portal / National Water Informatics Centre (NWIC), Government of India.

- Dataset page: https://nwdp.nwic.gov.in/dataset/state-boundary
- GeoJSON resource: https://nwdp.nwic.gov.in/dataset/dd960900-34cc-4486-a95c-83200d2f2c7b/resource/f039e721-132c-4a24-9e5e-07af03064b4d/download/state_nwic_geojson.zip

The original source CRS was EPSG:7755. It was converted to EPSG:4326 and simplified for web rendering; the complete process is documented in [India data preparation](../../documentation/india-map-data-preparation-wsl2.md). Globee does not manually edit boundary coordinates. MapLibre consumes this geometry directly, with no PingMetric/D3 winding adaptation. Source spellings in the GeoJSON remain untouched; canonical educational display names are handled separately by application metadata.

## World

`scripts/prepare-world-map.sh` converts `node_modules/world-atlas/countries-50m.json` into the local `world-countries-50m.geojson` browser asset with GDAL RFC 7946 output and dateline splitting.

- Package/version: `world-atlas` 2.0.2
- Source: Natural Earth 4.1.0 Admin-0
- Format: TopoJSON, converted to GeoJSON at runtime using `topojson-client`
- Renderer: MapLibre GL JS

All geographic geometry is local/static. Globee uses no hosted basemap, online tile service, or map API key.

## Prepared overlays

`oceans-50m.geojson` is prepared locally from Natural Earth 5.1.2 marine polygons by `scripts/prepare-oceans.sh`. It contains only ocean pieces grouped into Globee's five educational oceans and uses GDAL dateline processing.

`delhi-ncr.geojson` is prepared locally by `scripts/prepare-delhi-ncr.sh` and `scripts/extract-delhi-ncr.mjs`. It combines the NCRPB constituent list with NWDP district geometry and the existing whole-Delhi state geometry. It is a derived constituent overlay, not an official NCRPB polygon.
