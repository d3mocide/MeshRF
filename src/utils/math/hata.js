import { RF_CONSTANTS } from "../rfConstants";

/**
 * Okumura-Hata and COST 231-Hata path loss, client-side (ROADMAP P3-1 / P4-2).
 *
 * These mirror `calculate_hata_loss` / `calculate_cost231_loss` in
 * `rf-engine/rf_physics.py` term-for-term, including the input clamping, so a
 * link analysed in the browser and the same link analysed server-side agree.
 * Keeping them in JS lets the Hata models run with no backend -- which matters
 * for the offline/PWA path, where `/api/calculate-link` is unreachable.
 */

/** Environment keys accepted by the Hata family. */
export const HATA_ENVIRONMENTS = ["urban_large", "urban_small", "suburban", "rural"];

/**
 * Mobile (RX) antenna height correction a(hm).
 * Small/medium-city form is the default; large cities use a frequency-split form.
 * @param {number} freqMHz
 * @param {number} rxHeightM - clamped RX height
 * @param {string} environment
 * @returns {number} correction in dB
 */
const mobileHeightCorrection = (freqMHz, rxHeightM, environment) => {
  const logF = Math.log10(freqMHz);

  if (environment === "urban_large") {
    return freqMHz >= 400
      ? 3.2 * Math.pow(Math.log10(11.75 * rxHeightM), 2) - 4.97
      : 8.29 * Math.pow(Math.log10(1.54 * rxHeightM), 2) - 1.1;
  }

  // Urban small/medium (also used verbatim by COST 231)
  return (1.1 * logF - 0.7) * rxHeightM - (1.56 * logF - 0.8);
};

/** Clamp inputs the way the reference implementation does, to avoid log(0)/negatives. */
const clampInputs = (distanceKm, txHeightM, rxHeightM) => ({
  d: Math.max(RF_CONSTANTS.HATA.LIMITS.MIN_DIST_KM, distanceKm),
  hb: Math.max(RF_CONSTANTS.HATA.LIMITS.MIN_HEIGHT, txHeightM),
  hm: Math.max(RF_CONSTANTS.HATA.LIMITS.MIN_HEIGHT, rxHeightM),
});

/**
 * Okumura-Hata path loss. Valid for 150-1500 MHz, 1-20 km.
 * @param {number} distanceKm
 * @param {number} freqMHz
 * @param {number} txHeightM - base station height AGL
 * @param {number} rxHeightM - mobile height AGL
 * @param {string} [environment='urban_small'] - one of HATA_ENVIRONMENTS
 * @returns {number} Path loss in dB (never negative)
 */
export const calculateHataLoss = (
  distanceKm,
  freqMHz,
  txHeightM,
  rxHeightM,
  environment = "urban_small",
) => {
  const C = RF_CONSTANTS.HATA;
  const { d, hb, hm } = clampInputs(distanceKm, txHeightM, rxHeightM);

  const logF = Math.log10(freqMHz);
  const logHb = Math.log10(hb);
  const logD = Math.log10(d);

  const aHm = mobileHeightCorrection(freqMHz, hm, environment);

  // Lu = 69.55 + 26.16*log(f) - 13.82*log(hb) - a(hm) + (44.9 - 6.55*log(hb))*log(d)
  let loss =
    C.URBAN_BASE +
    C.FREQ_SCALE * logF -
    C.HB_SCALE * logHb -
    aHm +
    (C.DISTANCE_BASE - C.DISTANCE_HB_SCALE * logHb) * logD;

  if (environment === "suburban") {
    // Lsub = Lu - 2*(log(f/28))^2 - 5.4
    const val = Math.log10(freqMHz / 28);
    loss = loss - 2 * val * val - 5.4;
  } else if (environment === "rural") {
    // Lrural = Lu - 4.78*(log(f))^2 + 18.33*log(f) - 40.94
    loss = loss - 4.78 * logF * logF + 18.33 * logF - 40.94;
  }

  return Math.max(0, loss);
};

/**
 * COST 231-Hata path loss. Valid for 1500-2000 MHz, 1-20 km (ROADMAP P4-2).
 *
 * COST 231 defines only a metropolitan correction factor C (3 dB) on top of the
 * medium-city/suburban baseline -- it has no separate suburban or rural
 * correction term, so those environments evaluate identically to `urban_small`.
 * `getHataValidity` surfaces that to the user rather than silently reusing the
 * Okumura-Hata corrections, which are not defined at these frequencies.
 *
 * @param {number} distanceKm
 * @param {number} freqMHz
 * @param {number} txHeightM
 * @param {number} rxHeightM
 * @param {string} [environment='urban_small']
 * @returns {number} Path loss in dB (never negative)
 */
export const calculateCost231Loss = (
  distanceKm,
  freqMHz,
  txHeightM,
  rxHeightM,
  environment = "urban_small",
) => {
  const C = RF_CONSTANTS.COST231;
  const { d, hb, hm } = clampInputs(distanceKm, txHeightM, rxHeightM);

  const logF = Math.log10(freqMHz);
  const logHb = Math.log10(hb);
  const logD = Math.log10(d);

  // COST 231 always uses the small/medium-city a(hm) form.
  const aHm = mobileHeightCorrection(freqMHz, hm, "urban_small");
  const metro = environment === "urban_large" ? C.METRO_CORRECTION_DB : 0;

  // L = 46.3 + 33.9*log(f) - 13.82*log(hb) - a(hm) + (44.9 - 6.55*log(hb))*log(d) + C
  const loss =
    C.URBAN_BASE +
    C.FREQ_SCALE * logF -
    C.HB_SCALE * logHb -
    aHm +
    (C.DISTANCE_BASE - C.DISTANCE_HB_SCALE * logHb) * logD +
    metro;

  return Math.max(0, loss);
};

/**
 * Which Hata variant applies at a given frequency.
 * @param {number} freqMHz
 * @returns {'hata'|'cost231'}
 */
export const getHataVariant = (freqMHz) =>
  freqMHz >= RF_CONSTANTS.HATA_COST231_CROSSOVER_MHZ ? "cost231" : "hata";

/**
 * Hata-family dispatcher: picks Okumura-Hata below 1500 MHz and COST 231 at or
 * above it, so a single "Hata" model selection covers 150-2000 MHz.
 * @param {number} distanceKm
 * @param {number} freqMHz
 * @param {number} txHeightM
 * @param {number} rxHeightM
 * @param {string} [environment='urban_small']
 * @returns {number} Path loss in dB
 */
export const calculateHataFamilyLoss = (
  distanceKm,
  freqMHz,
  txHeightM,
  rxHeightM,
  environment = "urban_small",
) =>
  getHataVariant(freqMHz) === "cost231"
    ? calculateCost231Loss(distanceKm, freqMHz, txHeightM, rxHeightM, environment)
    : calculateHataLoss(distanceKm, freqMHz, txHeightM, rxHeightM, environment);

/**
 * Validity check for the Hata family, so the UI has one source of truth for
 * "you are extrapolating" warnings instead of inline magic numbers.
 * @param {object} params
 * @param {number} params.distanceKm
 * @param {number} params.freqMHz
 * @param {number} params.txHeightM
 * @param {number} [params.rxHeightM]
 * @param {string} [params.environment]
 * @returns {{variant: string, label: string, warnings: string[]}}
 */
export const getHataValidity = ({
  distanceKm,
  freqMHz,
  txHeightM,
  rxHeightM,
  environment = "urban_small",
}) => {
  const variant = getHataVariant(freqMHz);
  const limits = variant === "cost231" ? RF_CONSTANTS.COST231.VALID : RF_CONSTANTS.HATA.VALID;
  const label = variant === "cost231" ? "COST 231" : "Okumura-Hata";
  const warnings = [];

  // Frequency outside the whole family's envelope (150-2000 MHz).
  const [freqMin] = RF_CONSTANTS.HATA.VALID.FREQ_MHZ;
  const [, freqMax] = RF_CONSTANTS.COST231.VALID.FREQ_MHZ;
  if (freqMHz < freqMin || freqMHz > freqMax) {
    warnings.push(`Freq ${freqMHz}MHz (Limit ${freqMin}-${freqMax})`);
  }

  if (Number.isFinite(distanceKm)) {
    const [dMin, dMax] = limits.DIST_KM;
    if (distanceKm < dMin || distanceKm > dMax) {
      warnings.push(`Dist ${distanceKm.toFixed(1)}km (Limit ${dMin}-${dMax}km)`);
    }
  }

  if (Number.isFinite(txHeightM)) {
    const [hMin] = limits.TX_HEIGHT_M;
    if (txHeightM < hMin) {
      warnings.push(`TX ${txHeightM}m < ${hMin}m (${label} Min)`);
    }
  }

  if (Number.isFinite(rxHeightM)) {
    const [, rMax] = limits.RX_HEIGHT_M;
    if (rxHeightM > rMax) {
      warnings.push(`RX ${rxHeightM}m > ${rMax}m (${label} Max)`);
    }
  }

  // COST 231 has no suburban/rural correction terms of its own.
  if (variant === "cost231" && (environment === "suburban" || environment === "rural")) {
    warnings.push(`COST 231 has no ${environment} term -- using medium-city baseline`);
  }

  return { variant, label, warnings };
};
