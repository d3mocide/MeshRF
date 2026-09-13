/**
 * Runtime configuration accessor.
 *
 * Values resolve in priority order:
 *   1. `window._env_` -- written by `docker-entrypoint.sh` when the container
 *      starts, so an operator can reconfigure the published image without
 *      rebuilding it.
 *   2. `import.meta.env.VITE_<KEY>` -- inlined by Vite at build time. This is
 *      the path that works for `npm run dev` and for images built from source.
 *   3. The supplied fallback.
 *
 * The `window._env_` layer exists because the production image is prebuilt:
 * a `VITE_`-prefixed variable set in `docker-compose.yml` is read at *build*
 * time, so it can never reach an already-published image. Anything that must
 * be configurable at deploy time has to come through `window._env_`.
 *
 * Never route a secret through here. Everything it returns is readable by
 * anyone with the browser devtools open -- see the CARTO basemap proxy in
 * `nginx.conf` and `vite.config.js` for how credentials are kept server-side.
 */
export const getRuntimeConfig = (key, fallback = undefined) => {
    if (typeof window !== 'undefined' && window._env_ && window._env_[key]) {
        return window._env_[key];
    }
    const buildTime = import.meta.env[`VITE_${key}`];
    if (buildTime) return buildTime;
    return fallback;
};

/**
 * Reads a numeric runtime setting, rejecting anything unparseable or outside
 * the accepted range so a typo in `docker-compose.yml` degrades to the default
 * instead of handing Leaflet a NaN and blanking the map.
 *
 * @param {string} key - Config key, without the `VITE_` prefix.
 * @param {number} fallback - Value used when unset or invalid.
 * @param {Object} [bounds] - Optional inclusive `{ min, max }` range.
 * @returns {number}
 */
export const getRuntimeNumber = (key, fallback, bounds = {}) => {
    const raw = getRuntimeConfig(key);
    if (raw === undefined || raw === null || `${raw}`.trim() === '') return fallback;

    const parsed = Number.parseFloat(raw);
    const { min = -Infinity, max = Infinity } = bounds;

    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
        console.warn(
            `[meshRF] Ignoring invalid ${key} value "${raw}" -- using ${fallback} instead.`
        );
        return fallback;
    }
    return parsed;
};
