import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRuntimeConfig, getRuntimeNumber } from '../runtimeConfig';

describe('getRuntimeConfig', () => {
    beforeEach(() => {
        delete window._env_;
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        delete window._env_;
    });

    it('prefers window._env_, which is how the prebuilt Docker image is configured', () => {
        vi.stubEnv('VITE_MAP_LAT', '1.1');
        window._env_ = { MAP_LAT: '41.2565' };
        expect(getRuntimeConfig('MAP_LAT')).toBe('41.2565');
    });

    it('falls back to the build-time VITE_ variable used by npm run dev', () => {
        vi.stubEnv('VITE_MAP_LAT', '41.2565');
        expect(getRuntimeConfig('MAP_LAT')).toBe('41.2565');
    });

    it('falls back to the supplied default when nothing is set', () => {
        expect(getRuntimeConfig('MAP_LAT', 'fallback')).toBe('fallback');
    });

    it('ignores an empty window._env_ entry so the VITE_ layer still applies', () => {
        vi.stubEnv('VITE_DEFAULT_UNITS', 'metric');
        window._env_ = { DEFAULT_UNITS: '' };
        expect(getRuntimeConfig('DEFAULT_UNITS', 'imperial')).toBe('metric');
    });

    it('does not throw when window._env_ was never defined', () => {
        expect(() => getRuntimeConfig('ANYTHING')).not.toThrow();
        expect(getRuntimeConfig('ANYTHING')).toBeUndefined();
    });
});

describe('getRuntimeNumber', () => {
    beforeEach(() => {
        delete window._env_;
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
        delete window._env_;
    });

    it('parses a configured coordinate', () => {
        window._env_ = { MAP_LAT: '41.2565' };
        expect(getRuntimeNumber('MAP_LAT', 45.5152, { min: -90, max: 90 })).toBe(41.2565);
    });

    it('parses a negative longitude', () => {
        window._env_ = { MAP_LNG: '-95.9345' };
        expect(getRuntimeNumber('MAP_LNG', -122.6784, { min: -180, max: 180 })).toBe(-95.9345);
    });

    it('accepts zero rather than treating it as unset', () => {
        window._env_ = { MAP_LNG: '0' };
        expect(getRuntimeNumber('MAP_LNG', -122.6784, { min: -180, max: 180 })).toBe(0);
    });

    it('returns the fallback when unset', () => {
        expect(getRuntimeNumber('MAP_ZOOM', 13, { min: 0, max: 20 })).toBe(13);
    });

    it('returns the fallback for a blank value', () => {
        window._env_ = { MAP_ZOOM: '   ' };
        expect(getRuntimeNumber('MAP_ZOOM', 13, { min: 0, max: 20 })).toBe(13);
    });

    it('rejects a non-numeric value instead of handing Leaflet a NaN', () => {
        window._env_ = { MAP_LAT: 'not-a-number' };
        expect(getRuntimeNumber('MAP_LAT', 45.5152, { min: -90, max: 90 })).toBe(45.5152);
        expect(console.warn).toHaveBeenCalled();
    });

    it('rejects an out-of-range latitude', () => {
        window._env_ = { MAP_LAT: '120' };
        expect(getRuntimeNumber('MAP_LAT', 45.5152, { min: -90, max: 90 })).toBe(45.5152);
    });

    it('rejects an out-of-range longitude', () => {
        window._env_ = { MAP_LNG: '-400' };
        expect(getRuntimeNumber('MAP_LNG', -122.6784, { min: -180, max: 180 })).toBe(-122.6784);
    });

    it('reads coordinates from the VITE_ layer used in dev', () => {
        vi.stubEnv('VITE_MAP_LAT', '41.2565');
        vi.stubEnv('VITE_MAP_LNG', '-95.9345');
        expect(getRuntimeNumber('MAP_LAT', 45.5152, { min: -90, max: 90 })).toBe(41.2565);
        expect(getRuntimeNumber('MAP_LNG', -122.6784, { min: -180, max: 180 })).toBe(-95.9345);
    });
});
