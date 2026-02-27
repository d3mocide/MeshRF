
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
