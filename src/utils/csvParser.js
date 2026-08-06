import { DEVICE_PRESETS, ANTENNA_PRESETS } from "../data/presets";

/**
 * Parses a generic CSV content into an array of objects.
 * Simple parser that splits by comma, handles basic headers.
 * Does NOT handle quoted fields with commas inside.
 * @param {string} text - The CSV text content.
 * @returns {Array} Array of objects where keys are headers.
 */
export const parseCSV = (text) => {
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const results = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        const row = {};

        // Map values to headers
        headers.forEach((header, idx) => {
            if (values[idx] !== undefined) {
                row[header] = values[idx];
            }
        });

        results.push(row);
    }
    return results;
};

/**
 * Normalize a free-text preset reference to a preset key.
 * "Heltec V3" / "heltec-v3" / "HELTEC_V3" all resolve to "HELTEC_V3".
 * @param {string} value
 * @returns {string}
 */
const normalizePresetKey = (value) =>
    String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

/**
 * Resolve a device column value against DEVICE_PRESETS, by key or display name.
 * @param {string} value
 * @returns {string|undefined} Preset id, or undefined if unrecognized
 */
export const resolveDevicePreset = (value) => {
    if (!value) return undefined;
    const key = normalizePresetKey(value);
    if (DEVICE_PRESETS[key]) return key;

    const match = Object.values(DEVICE_PRESETS).find(
        (preset) => normalizePresetKey(preset.name) === key
    );
    return match ? match.id : undefined;
};

/**
 * Resolve an antenna column value against ANTENNA_PRESETS, by key or display name.
 * @param {string} value
 * @returns {string|undefined} Preset id, or undefined if unrecognized
 */
export const resolveAntennaPreset = (value) => {
    if (!value) return undefined;
    const key = normalizePresetKey(value);
    if (ANTENNA_PRESETS[key]) return key;

    const match = Object.values(ANTENNA_PRESETS).find(
        (preset) => normalizePresetKey(preset.name) === key
    );
    return match ? match.id : undefined;
};

/** Parse a numeric cell, returning undefined (not NaN) when absent or unparseable. */
const parseOptionalFloat = (value) => {
    if (value === undefined || value === null || String(value).trim() === '') return undefined;
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : undefined;
};

/**
 * Extract optional per-node hardware overrides from a parsed CSV row (ROADMAP P3-4).
 *
 * Every column is optional; anything absent is left undefined so the caller can
 * fall back to the global A/B config. Recognized headers:
 *   antenna_height | height | agl   -> antennaHeight (m)
 *   antenna_gain   | gain           -> antennaGain (dBi)
 *   tx_power       | power          -> txPower (dBm)
 *   device                          -> DEVICE_PRESETS id
 *   antenna | antenna_type          -> ANTENNA_PRESETS id (supplies gain if not given)
 *
 * @param {Object} row - Row keyed by lowercased header
 * @returns {Object|undefined} Override object, or undefined when the row carries none
 */
export const parseNodeConfigOverrides = (row) => {
    const config = {};

    const height = parseOptionalFloat(row.antenna_height ?? row.height ?? row.agl);
    if (height !== undefined) config.antennaHeight = height;

    const txPower = parseOptionalFloat(row.tx_power ?? row.power);
    if (txPower !== undefined) config.txPower = txPower;

    const device = resolveDevicePreset(row.device);
    if (device) config.device = device;

    const antenna = resolveAntennaPreset(row.antenna ?? row.antenna_type);
    if (antenna) config.antenna = antenna;

    // Explicit gain wins over the antenna preset's nominal gain.
    const gain = parseOptionalFloat(row.antenna_gain ?? row.gain);
    if (gain !== undefined) {
        config.antennaGain = gain;
    } else if (antenna && ANTENNA_PRESETS[antenna]) {
        config.antennaGain = ANTENNA_PRESETS[antenna].gain;
    }

    return Object.keys(config).length > 0 ? config : undefined;
};

/**
 * Parses node data specifically from CSV rows.
 * Attempts to intelligently find lat/lon/name fields, and picks up the optional
 * per-node hardware columns described in parseNodeConfigOverrides (P3-4).
 * @param {string} text - CSV content
 * @returns {Array} Array of node objects {id, name, lat, lng, config?}
 */
export const parseBatchNodesCSV = (text) => {
    const rows = parseCSV(text);
    const nodes = [];

    rows.forEach((row, idx) => {
        let lat, lng, name;

        // 1. Try explicit headers
        if (row.lat) lat = parseFloat(row.lat);
        else if (row.latitude) lat = parseFloat(row.latitude);

        if (row.lon) lng = parseFloat(row.lon);
        else if (row.lng) lng = parseFloat(row.lng);
        else if (row.longitude) lng = parseFloat(row.longitude);

        if (row.name) name = row.name;
        else if (row.site) name = row.site;
        else if (row.id) name = row.id;

        // 2. If explicit fail, try heuristic on first few columns if headers are missing/weird
        // (This part is tricky with the generic parser above which relies on headers.
        //  The generic parser already consumed the first line as headers.
        //  If the CSV has no headers, this will fail.
        //  We'll stick to the logic from the original BatchProcessing for headerless/heuristic support if needed,
        //  but for now let's assume headers or improve the parser.)

        // Fallback for the specific logic in original file which handled:
        // "Name, Lat, Lon" OR "Lat, Lon, Name" detection

        if (isNaN(lat) || isNaN(lng)) {
            // Re-parse raw line logic from original component might be safer if structure varies wildly
            return;
        }

        if (!name) name = `Node ${idx + 1}`;

        if (!isNaN(lat) && !isNaN(lng)) {
            const node = { id: idx, name, lat, lng };
            const config = parseNodeConfigOverrides(row);
            if (config) node.config = config;
            nodes.push(node);
        }
    });

    // If generic parsing failed (e.g. no standard headers), fall back to position-based
    if (nodes.length === 0) {
        const lines = text.split('\n');
        // Skip header if it looks like text
        let startIdx = 0;
        const firstLineParts = lines[0].split(',');
        if (isNaN(parseFloat(firstLineParts[1]))) startIdx = 1; // Assume header

        for(let i=startIdx; i<lines.length; i++) {
             const line = lines[i].trim();
             if(!line) continue;
             const parts = line.split(',');
             if(parts.length >= 2) {
                 // Try Lat, Lon, Name
                 let p0 = parseFloat(parts[0]);
                 let p1 = parseFloat(parts[1]);
                 if (!isNaN(p0) && !isNaN(p1)) {
                     nodes.push({ id: i, lat: p0, lng: p1, name: parts[2] || `Node ${i}` });
                     continue;
                 }

                 // Try Name, Lat, Lon
                 p0 = parseFloat(parts[1]);
                 p1 = parseFloat(parts[2]);
                 if (!isNaN(p0) && !isNaN(p1)) {
                     nodes.push({ id: i, lat: p0, lng: p1, name: parts[0] || `Node ${i}` });
                 }
             }
        }
    }

    return nodes;
};
