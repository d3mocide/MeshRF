import { calculateFSPL } from "./fspl";
import { calculateLoRaSensitivity } from "./lora";

/**
 * Calculate Link Budget
 * @param {Object} params
 * @param {number} params.txPower - TX Power in dBm
 * @param {number} params.txGain - TX Antenna Gain in dBi
 * @param {number} params.txLoss - TX Cable Loss in dB
 * @param {number} params.rxGain - RX Antenna Gain in dBi
 * @param {number} params.rxLoss - RX Cable Loss in dB
 * @param {number} params.distanceKm - Distance in Km
 * @param {number} params.freqMHz - Frequency in MHz
 * @param {number} params.sf - Spreading Factor (for sensitivity)
 * @param {number} params.bw - Bandwidth in kHz (for sensitivity)
 * @param {number} [params.pathLossOverride=null] - Optional override for path loss in dB
 * @returns {Object} { rssi, fspl, sensitivity, margin }
 */
export const calculateLinkBudget = ({
  txPower,
  txGain,
  txLoss,
  rxGain,
  rxLoss,
  distanceKm,
  freqMHz,
  sf,
  bw,

  pathLossOverride = null,
  excessLoss = 0,
  fadeMargin = 10,
}) => {
  const fspl = pathLossOverride !== null ? pathLossOverride : calculateFSPL(distanceKm, freqMHz);

  // RSSI = Ptx + Gtx - Ltx - PathLoss - ExcessLoss - FadeMargin + Grx - Lrx
  const rssi = txPower + txGain - txLoss - fspl - excessLoss - fadeMargin + rxGain - rxLoss;

  const sensitiveLimit = calculateLoRaSensitivity(sf, bw);
  const linkMargin = rssi - sensitiveLimit;

  return {
    rssi: parseFloat(rssi.toFixed(2)),
    fspl: parseFloat(fspl.toFixed(2)),
    sensitivity: parseFloat(sensitiveLimit.toFixed(2)),
    margin: parseFloat(linkMargin.toFixed(2)),
  };
};
