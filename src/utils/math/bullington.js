import { calculateEarthBulge } from "./earth";

/**
 * Calculate Bullington Diffraction Loss (simplified)
 * Finds the "dominant obstacle" and calculates knife-edge diffraction.
 * @param {Array} profile - {distance (km), elevation (m), earthBulge (m)}
 * @param {number} freqMHz
 * @param {number} txHeightAGL - needed if not baked into profile
 * @param {number} rxHeightAGL - needed if not baked into profile
 * @returns {number} Additional Loss in dB
 */
export const calculateBullingtonDiffraction = (profile, freqMHz, txHeightAGL, rxHeightAGL) => {
    if (!profile || profile.length < 3) return 0;

    const start = profile[0];
    const end = profile[profile.length - 1];

    // Convert heights to AMSL (Above Mean Sea Level)
    const txElev = start.elevation + txHeightAGL;
    const rxElev = end.elevation + rxHeightAGL;

    // Line of Sight Equation: y = mx + b
    const totalDist = end.distance;
    const slope = (rxElev - txElev) / totalDist;
    const intercept = txElev; // at x=0

    let maxV = -Infinity;

    // Iterate points to find highest "v" (Fresnel Diffraction Parameter)
    for (let i = 1; i < profile.length - 1; i++) {
        const pt = profile[i];
        const d_km = pt.distance; // distance from tx

        const bulge = calculateEarthBulge(d_km, totalDist);
        const effectiveH = pt.elevation + bulge;

        // LOS Height at this point
        const losH = (slope * d_km) + intercept;

        // h = Vertical distance from LOS to Obstacle Tip
        const h = effectiveH - losH;

        // Fresnel Parameter v
        const d1 = d_km * 1000; // meters
        const d2 = (totalDist - d_km) * 1000; // meters
        const wavelength = 300 / freqMHz; // meters

        const geom = (2 * (d1 + d2)) / (wavelength * d1 * d2);
        const v = h * Math.sqrt(geom);

        if (v > maxV) {
            maxV = v;
        }
    }

    if (maxV <= -1) return 0; // Clear LOS with good clearance

    let diffractionLoss = 0;

    if (maxV > -0.78) {
        // ITU-R P.526-14 Equation 31: J(v) = 6.9 + 20*log10(sqrt((v-0.1)^2 + 1) + v - 0.1)
        const term = maxV - 0.1;
        const val = Math.sqrt(term * term + 1) + term;
        diffractionLoss = 6.9 + 20 * Math.log10(val);
    }

    return Math.max(0, parseFloat(diffractionLoss.toFixed(2)));
};
