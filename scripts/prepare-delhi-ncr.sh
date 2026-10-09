#!/usr/bin/env bash
set -euo pipefail
workspace="$(mktemp -d)"
trap 'rm -rf "$workspace"' EXIT
zip_path="$workspace/district_nwic_geojson.zip"
curl -L 'https://nwdp.nwic.gov.in/dataset/6c1af675-1dec-4927-882c-c1ba9d73f76b/resource/8d9aa2e9-9806-4f26-a4ac-48ba21e9b96d/download/district_nwic_geojson.zip' -o "$zip_path"
unzip -q "$zip_path" -d "$workspace/source"
district_source="$(find "$workspace/source" -iname '*.geojson' -o -iname '*.json' | head -n 1)"
if [[ -z "$district_source" ]]; then echo 'No district GeoJSON found in archive.' >&2; exit 1; fi
ogr2ogr --version >/dev/null
district_wgs84="$workspace/districts-wgs84.geojson"
ogr2ogr -f GeoJSON "$district_wgs84" "$district_source" -t_srs EPSG:4326 -lco RFC7946=YES -lco COORDINATE_PRECISION=6
node scripts/extract-delhi-ncr.mjs "$district_wgs84" public/maps/india-states.geojson public/maps/delhi-ncr.geojson
