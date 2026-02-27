import { RF_CONSTANTS } from "../rfConstants";

/**
 * Calculate LoRa Receiver Sensitivity (canonical, SX1262 datasheet)
 * Uses per-SF lookup table at 125kHz, scaled for actual bandwidth.
 * @param {number} sf - Spreading Factor (7-12)
 * @param {number} bw - Bandwidth in kHz
 * @returns {number} Sensitivity in dBm
 */
export const calculateLoRaSensitivity = (sf, bw) => {
  const table = RF_CONSTANTS.LORA.SENSITIVITY_125KHZ;
  const baseSensitivity = table[sf] !== undefined ? table[sf] : table[7];

  // Scale for bandwidth: 10*log10(BW/125) -- doubling BW worsens by 3 dB
  const bwFactor = 10 * Math.log10((bw || 125) / RF_CONSTANTS.LORA.REF_BW_KHZ);

  return parseFloat((baseSensitivity + bwFactor).toFixed(1));
};
