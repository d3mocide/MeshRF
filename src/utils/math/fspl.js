
/**
 * Calculate Free Space Path Loss (FSPL) in dB
 * @param {number} distanceKm - Distance in Kilometers
 * @param {number} freqMHz - Frequency in MHz
 * @returns {number} Path Loss in dB
 */
export const calculateFSPL = (distanceKm, freqMHz) => {
  if (distanceKm <= 0) return 0;
  // FSPL(dB) = 20log10(d) + 20log10(f) + 32.45  (ITU-R P.525-4)
  return 20 * Math.log10(distanceKm) + 20 * Math.log10(freqMHz) + 32.45;
};
