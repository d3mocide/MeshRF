import { calculateFSPL } from "./fspl";
import { calculateHataFamilyLoss } from "./hata";

/**
 * Client-side path loss dispatch (ROADMAP P3-1).
 *
 * Mirrors the `model` switch in `rf-engine/rf_physics.py::calculate_path_loss`
 * for the models that need no terrain profile, so the Link tool can resolve
 * them without a `/api/calculate-link` round trip.
 *
 * `bullington` and `itm` stay server-side on purpose: the backend applies
 * `clutter_height` and `k_factor` to the terrain profile, and the current JS
 * `calculateBullingtonDiffraction` does not, so moving them would silently
 * change results. `itm_wasm` is handled separately by the WASM ITM path.
 */

/** Models resolvable entirely in the browser. */
export const CLIENT_SIDE_MODELS = ["fspl", "hata", "cost231"];

/**
 * @param {string} model
 * @returns {boolean} true when `calculateClientPathLoss` can resolve this model
 */
export const isClientSideModel = (model) =>
  CLIENT_SIDE_MODELS.includes(String(model || "").toLowerCase());

/**
 * Resolve path loss for a client-side model.
 * @param {object} params
 * @param {string} params.model - 'fspl' | 'hata' | 'cost231'
 * @param {number} params.distanceKm
 * @param {number} params.freqMHz
 * @param {number} params.txHeightM
 * @param {number} params.rxHeightM
 * @param {string} [params.environment='suburban']
 * @returns {number|null} Path loss in dB, or null if the model is not client-side
 */
export const calculateClientPathLoss = ({
  model,
  distanceKm,
  freqMHz,
  txHeightM,
  rxHeightM,
  environment = "suburban",
}) => {
  const normalized = String(model || "").toLowerCase();

  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null;

  if (normalized === "fspl") {
    return calculateFSPL(distanceKm, freqMHz);
  }

  if (normalized === "hata" || normalized === "cost231") {
    return calculateHataFamilyLoss(distanceKm, freqMHz, txHeightM, rxHeightM, environment);
  }

  return null;
};
