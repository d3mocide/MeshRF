import { DEVICE_PRESETS } from '../data/presets';

/**
 * Merge a node's optional per-node overrides over a global A/B hardware config
 * (ROADMAP P3-4).
 *
 * Overrides come from the optional CSV columns parsed by
 * `parseNodeConfigOverrides`; any field the node does not specify falls back to
 * the global config, so an import with no extra columns behaves exactly as
 * before.
 *
 * @param {Object} node - Batch node, may carry a `config` override object
 * @param {Object} globalConfig - nodeConfigs.A or nodeConfigs.B
 * @returns {{antennaHeight: number, antennaGain: number, txPower: number, device: string, loss: number}}
 */
export const resolveNodeConfig = (node, globalConfig) => {
    const override = (node && node.config) || {};
    const device = override.device ?? globalConfig.device;

    return {
        antennaHeight: parseFloat(override.antennaHeight ?? globalConfig.antennaHeight),
        antennaGain: parseFloat(override.antennaGain ?? globalConfig.antennaGain),
        txPower: parseFloat(override.txPower ?? globalConfig.txPower),
        device,
        loss: DEVICE_PRESETS[device]?.loss || 0,
    };
};
