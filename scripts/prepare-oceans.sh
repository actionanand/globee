#!/usr/bin/env bash
set -euo pipefail
workspace="$(mktemp -d)"
trap 'rm -rf "$workspace"' EXIT
source_file="$workspace/ne_50m_geography_marine_polys.geojson"
raw_file="$workspace/oceans-50m.raw.geojson"
curl -L 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_geography_marine_polys.geojson' -o "$source_file"
node scripts/prepare-oceans.mjs "$source_file" "$raw_file"
ogr2ogr -f GeoJSON public/maps/oceans-50m.geojson "$raw_file" -lco RFC7946=YES -lco COORDINATE_PRECISION=6 -wrapdateline
node scripts/validate-prepared-geojson.mjs public/maps/oceans-50m.geojson oceans
