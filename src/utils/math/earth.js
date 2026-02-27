import { RF_CONSTANTS } from "../rfConstants";

/**
 * Calculate Earth Bulge at a specific point
 * @param {number} distKm - Distance from start point (km)
 * @param {number} totalDistKm - Total link distance (km)
 * @param {number} kFactor - Standard Refraction Factor (default 1.33)
 * @returns {number} Bulge height in meters
 */
export const calculateEarthBulge = (distKm, totalDistKm, kFactor = RF_CONSTANTS.K_FACTOR_DEFAULT) => {
  // Earth Radius (km)
  const R = RF_CONSTANTS.EARTH_RADIUS_KM;
  const Re = R * kFactor; // Effective Radius

  const d1 = distKm;
  const d2 = totalDistKm - distKm;

  // h = (d1 * d2) / (2 * Re)
  // Result in km, convert to meters
  const hKm = (d1 * d2) / (2 * Re);
  return hKm * 1000;
};
