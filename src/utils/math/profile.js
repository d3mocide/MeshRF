import { RF_CONSTANTS } from "../rfConstants";
import { calculateEarthBulge } from "./earth";
import { calculateFresnelRadius } from "./fresnel";

/**
 * Analyze Link Profile for Obstructions (Geodetic + Clutter + Fresnel Standards)
 * @param {Array} profile - Array of {distance, elevation} points (distance in km, elevation in m)
 * @param {number} freqMHz - Frequency
 * @param {number} txHeightAGL - TX Antenna Height (m)
 * @param {number} rxHeightAGL - RX Antenna Height (m)
 * @param {number} kFactor - Atmospheric Refraction (default 1.33)
 * @param {number} clutterHeight - Uniform Clutter Height (e.g., Trees/Urban) default 0
 * @returns {Object} { minClearance, isObstructed, linkQuality, profileWithStats }
 */
export const analyzeLinkProfile = (
  profile,
  freqMHz,
  txHeightAGL,
  rxHeightAGL,
  kFactor = RF_CONSTANTS.K_FACTOR_DEFAULT,
  clutterHeight = 0,
) => {
  if (!profile || profile.length === 0)
    return { isObstructed: false, minClearance: 999 };

  const startPt = profile[0];
  const endPt = profile[profile.length - 1];
  const totalDistKm = endPt.distance;

  const txH = startPt.elevation + txHeightAGL;
  const rxH = endPt.elevation + rxHeightAGL;

  let minClearance = 9999;
  let isObstructed = false;
  let worstFresnelRatio = 1.0; // 1.0 = Fully Clear. < 0.6 = Bad.

  const profileWithStats = profile.map((pt) => {
    const d = pt.distance; // km

    // 1. Calculate Earth Bulge
    const bulge = calculateEarthBulge(d, totalDistKm, kFactor);

    // 2. Effective Terrain Height (Terrain + Bulge + Clutter)
    const effectiveTerrain = pt.elevation + bulge + clutterHeight;

    // 3. LOS Height at this distance
    const ratio = d / totalDistKm;
    const losHeight = txH + (rxH - txH) * ratio;

    // 4. Fresnel Radius (m)
    const f1 = calculateFresnelRadius(totalDistKm, freqMHz, d);

    // 5. Clearance (m) relative to F1 bottom
    // Positive = Clear of F1. Negative = Inside F1 or Obstructed.
    const distFromCenter = losHeight - effectiveTerrain;
    const clearance = distFromCenter - f1;

    // Ratio of Clearance / F1 Radius (for quality check)
    // 60% rule means distFromCenter >= 0.6 * F1
    const fRatio = f1 > 0 ? distFromCenter / f1 : 1;

    if (fRatio < worstFresnelRatio) worstFresnelRatio = fRatio;
    if (clearance < minClearance) minClearance = clearance;

    // Obstructed logic
    if (distFromCenter <= 0) isObstructed = true;

    return {
      ...pt,
      earthBulge: bulge,
      effectiveTerrain,
      losHeight,
      f1Radius: f1,
      clearance,
      fresnelRatio: fRatio,
    };
  });

  // Determine Link Quality String
  // Excellent (>0.8), Good (>0.6), Marginal (>0), Obstructed (<=0)

  let linkQuality = "Obstructed";
  if (worstFresnelRatio >= RF_CONSTANTS.FRESNEL.QUALITY.EXCELLENT) linkQuality = "Excellent (+++)";
  else if (worstFresnelRatio >= RF_CONSTANTS.FRESNEL.QUALITY.GOOD)
    linkQuality = "Good (++)"; // 60% rule
  else if (worstFresnelRatio > RF_CONSTANTS.FRESNEL.QUALITY.MARGINAL)
    linkQuality = "Marginal (+)"; // Visual LOS, but heavy Fresnel
  else linkQuality = "Obstructed (-)"; // No Visual LOS

  return {
    minClearance: parseFloat(minClearance.toFixed(1)),
    isObstructed,
    linkQuality,
    profileWithStats,
  };
};
