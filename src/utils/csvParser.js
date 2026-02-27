
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
 * Parses node data specifically from CSV rows.
 * Attempts to intelligently find lat/lon/name fields.
 * @param {string} text - CSV content
 * @returns {Array} Array of node objects {id, name, lat, lng}
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
            nodes.push({ id: idx, name, lat, lng });
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
