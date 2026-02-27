
/**
 * Fetches an elevation tile image from the API and decodes it into a Float32Array.
 * The image is expected to encode elevation in RGB as: -10000 + ((R * 256^2 + G * 256 + B) * 0.1)
 *
 * @param {Object} tile - The tile coordinates {x, y, z}.
 * @returns {Promise<Object|null>} An object with { elevation: Float32Array, width, height, tile } or null if failed.
 */
export const fetchAndDecodeTile = async (tile) => {
    const tileUrl = `/api/tiles/${tile.z}/${tile.x}/${tile.y}.png`;
    try {
        const response = await fetch(tileUrl);
        if (!response.ok) return null;
        const blob = await response.blob();

        // Use createImageBitmap for performance if available, otherwise fallback to Image()
        let img;
        if (typeof createImageBitmap !== 'undefined') {
            img = await createImageBitmap(blob);
        } else {
            img = await new Promise((resolve, reject) => {
                const i = new Image();
                i.onload = () => resolve(i);
                i.onerror = reject;
                i.src = URL.createObjectURL(blob);
            });
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;
        const floatData = new Float32Array(img.width * img.height);

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            // Decode Mapbox Terrain-RGB format
            floatData[i / 4] = -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
        }

        return {
            elevation: floatData,
            width: img.width,
            height: img.height,
            tile
        };
    } catch (err) {
        console.warn(`Failed to fetch tile ${tile.x}/${tile.y}`, err);
        return null;
    }
};
