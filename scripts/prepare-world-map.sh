#!/usr/bin/env bash
set -euo pipefail
workspace="$(mktemp -d)"
trap 'rm -rf "$workspace"' EXIT
temporary="$workspace/world-countries-50m.raw.geojson"
node scripts/prepare-world-map.mjs "$temporary"
ogr2ogr -f GeoJSON public/maps/world-countries-50m.geojson "$temporary" -lco RFC7946=YES -lco COORDINATE_PRECISION=6 -wrapdateline
node scripts/validate-prepared-geojson.mjs public/maps/world-countries-50m.geojson world
echo 'Output: public/maps/world-countries-50m.geojson'
