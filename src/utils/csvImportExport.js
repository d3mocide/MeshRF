
/**
 * Parses a CSV string into an array of node objects.
 * Expects headers: name, lat, lon (or lng), antenna_height, tx_power.
 * @param {string} csvText - The raw CSV content.
 * @returns {Array} Array of node objects.
 */
export const parseNodeCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

    const importedNodes = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        const node = {};

        headers.forEach((header, idx) => {
            const val = values[idx];
            if (header === 'lat') node.lat = parseFloat(val);
            else if (header === 'lon' || header === 'lng') node.lon = parseFloat(val);
            else if (header === 'name') node.name = val;
            else if (header === 'antenna_height') node.height = parseFloat(val);
            else if (header === 'tx_power') node.txPower = parseFloat(val);
        });

        if (!isNaN(node.lat) && !isNaN(node.lon)) {
            importedNodes.push({
                lat: node.lat,
                lon: node.lon,
                height: node.height || 10,
                name: node.name || `Imported Site ${i}`,
                txPower: node.txPower || 20
            });
        }
    }
    return importedNodes;
};

/**
 * Escape a value for CSV output: quote it when it contains a delimiter,
 * quote or newline, doubling any embedded quotes.
 * @param {*} value
 * @returns {string}
 */
export const csvEscape = (value) => {
    const str = value === undefined || value === null ? '' : String(value);
    return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

/**
 * Trigger a browser download for generated text content.
 * @param {string} content
 * @param {string} filename
 * @param {string} [mimeType='text/csv;charset=utf-8']
 */
export const downloadTextFile = (content, filename, mimeType = 'text/csv;charset=utf-8') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Trigger a download of the batch-nodes CSV template (ROADMAP P3-4).
 * Name/Lat/Lon are required; the remaining columns are optional per-node
 * overrides that fall back to the global A/B config when blank.
 */
export const downloadBatchNodesTemplate = () => {
    const rows = [
        'Name,Lat,Lon,Antenna_Height,Antenna_Gain,TX_Power,Device,Antenna',
        // Fully specified site
        'Site Alpha,45.5152,-122.6784,30,8,22,HELTEC_V3,OMNI_HIGH',
        // Height + antenna preset only (gain comes from the preset)
        'Site Bravo,45.5252,-122.6684,12,,,,DIPOLE',
        // Height override only
        'Site Charlie,45.5052,-122.6884,6,,,,',
        // No overrides at all -- inherits the global config
        'Site Delta,45.5100,-122.6500,,,,,',
        'Site Echo,45.5300,-122.6900,45,11,27,STATION_G2,YAGI',
    ];
    downloadTextFile(rows.join('\n'), 'meshrf_template.csv');
};

/**
 * Trigger a download of the CSV template for nodes.
 */
export const downloadNodeTemplate = () => {
    const headers = 'name,lat,lon,antenna_height,tx_power\n';
    const example = 'Site A,45.5152,-122.6784,15,20\nSite B,45.5230,-122.6670,10,20';
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mesh-site-template.csv';
    a.click();
    URL.revokeObjectURL(url);
};
