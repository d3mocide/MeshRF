#!/bin/sh
set -eu

# The production image is prebuilt, so Vite has already run by the time this
# container starts: a VITE_-prefixed variable set in docker-compose.yml can
# never reach the bundle. Anything an operator needs to change at deploy time
# is therefore written into window._env_ here and read back by
# src/utils/runtimeConfig.js.

# UI defaults
: "${DEFAULT_MAP_STYLE:=dark_green}"
: "${DEFAULT_UNITS:=imperial}"

# Initial map view. VITE_MAP_LAT / VITE_MAP_LNG are accepted as deprecated
# aliases so existing docker-compose.yml files keep working.
: "${MAP_LAT:=${VITE_MAP_LAT:-45.5152}}"
: "${MAP_LNG:=${VITE_MAP_LNG:--122.6784}}"
: "${MAP_ZOOM:=${VITE_MAP_ZOOM:-13}}"

# Recreate config file
#
# Only non-sensitive settings belong here -- this file is served to every
# visitor. CARTO_API_KEY is deliberately absent; it is injected server-side by
# the /basemaps proxy below.
CONFIG_FILE=/usr/share/nginx/html/env-config.js
rm -f "$CONFIG_FILE"

{
    echo "window._env_ = {"
    echo "  DEFAULT_MAP_STYLE: \"${DEFAULT_MAP_STYLE}\","
    echo "  DEFAULT_UNITS: \"${DEFAULT_UNITS}\","
    echo "  MAP_LAT: \"${MAP_LAT}\","
    echo "  MAP_LNG: \"${MAP_LNG}\","
    echo "  MAP_ZOOM: \"${MAP_ZOOM}\","
    echo "};"
} > "$CONFIG_FILE"

# Render the Nginx config.
#
# CARTO watermarks unauthenticated raster tiles, so the /basemaps proxy appends
# an API key on the way out. Keeping the key in the Nginx config (root-owned,
# never served) rather than in env-config.js is what stops it from being
# scraped out of the page by anyone who loads the app.
: "${CARTO_API_KEY:=}"
if [ -n "$CARTO_API_KEY" ]; then
    CARTO_TILE_QUERY="?key=${CARTO_API_KEY}"
else
    echo "meshRF: CARTO_API_KEY is not set -- CARTO basemaps will render with an" >&2
    echo "        'API KEY REQUIRED' watermark. Request a free key at"           >&2
    echo "        https://carto.com/basemaps/apikey/ or switch DEFAULT_MAP_STYLE" >&2
    echo "        to topo / topo_dark / satellite, which need no key."           >&2
    CARTO_TILE_QUERY=""
fi
export CARTO_TILE_QUERY

# Belt-and-braces: Nginx creates its own proxy_cache_path directory at startup.
# Tolerate failure so a hardened deployment running as a non-root `user:` does
# not crash-loop here.
mkdir -p /var/cache/nginx/basemaps 2>/dev/null || true

envsubst '${CARTO_TILE_QUERY}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf
chmod 600 /etc/nginx/conf.d/default.conf

# Execute the passed command (nginx)
exec "$@"
