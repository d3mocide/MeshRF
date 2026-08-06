// Hook and Provider are intentionally colocated so consumers have a single
// import surface. This only costs Fast Refresh's component-only hot-swap
// granularity in dev mode (editing this file triggers a full reload instead
// of a state-preserving hot-swap) -- it has no effect on correctness or
// production builds.
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo } from "react";
import { DEVICE_PRESETS, ANTENNA_PRESETS, CABLE_TYPES } from "../data/presets";

const HardwareContext = createContext();

export const useHardware = () => useContext(HardwareContext);

export const HardwareProvider = ({ children }) => {
    // --- NODE-SPECIFIC CONFIGURATION ---
    const [editMode, setEditMode] = useState("GLOBAL"); // 'GLOBAL', 'A', 'B'

    const DEFAULT_CONFIG = {
        device: "HELTEC_V3",
        antenna: "DIPOLE",
        txPower: 20,
        antennaHeight: 9.144, // 30 feet in meters
        antennaGain: ANTENNA_PRESETS.DIPOLE.gain,
        cableType: "LMR400",
        cableLength: 0.3048, // 1 ft in meters
    };

    const [nodeConfigs, setNodeConfigs] = useState({
        A: { ...DEFAULT_CONFIG },
        B: { ...DEFAULT_CONFIG },
    });

    const [batchNodes, setBatchNodes] = useState([]);

    const updateConfig = (key, value) => {
        setNodeConfigs((prev) => {
            const newConfigs = {
                A: { ...prev.A },
                B: { ...prev.B }
            };

            const nodesToUpdate = editMode === "GLOBAL" ? ["A", "B"] : [editMode];

            nodesToUpdate.forEach(node => {
                newConfigs[node][key] = value;

                // Side Effects Logic (Synchronous)
                if (key === 'device') {
                    const deviceMax = DEVICE_PRESETS[value]?.tx_power_max;
                    if (deviceMax && newConfigs[node].txPower > deviceMax) {
                        newConfigs[node].txPower = deviceMax;
                    }
                }
                if (key === 'antenna') {
                    if (value !== 'CUSTOM') {
                         const correctGain = ANTENNA_PRESETS[value]?.gain;
                         if (correctGain !== undefined) {
                             newConfigs[node].antennaGain = correctGain;
                         }
                    }
                }
            });
            return newConfigs;
        });
    };

    // Derived Values
    const currentConfig = editMode === "GLOBAL" ? nodeConfigs.A : nodeConfigs[editMode];

    // Proxies
    const selectedDevice = currentConfig.device;
    const selectedAntenna = currentConfig.antenna;
    const txPower = currentConfig.txPower;
    const antennaHeight = currentConfig.antennaHeight;
    const antennaGain = currentConfig.antennaGain;
    const selectedCableType = currentConfig.cableType || "LMR400";
    const cableLength = currentConfig.cableLength !== undefined ? currentConfig.cableLength : 1;

    // Calculations
    const deviceLoss = DEVICE_PRESETS[selectedDevice]?.loss || 0;
    const cableConfig = CABLE_TYPES[selectedCableType] || CABLE_TYPES.LMR400;
    const cableLossVal = deviceLoss + cableConfig.loss_per_meter * (parseFloat(cableLength) || 0);
    const cableLoss = parseFloat(cableLossVal.toFixed(2));
    const erp = (txPower + antennaGain - cableLoss).toFixed(1);

    const value = useMemo(() => ({
        nodeConfigs, setNodeConfigs,
        editMode, setEditMode,
        batchNodes, setBatchNodes,
        updateConfig,

        // Proxies
        selectedDevice, setSelectedDevice: (val) => updateConfig("device", val),
        selectedAntenna, setSelectedAntenna: (val) => updateConfig("antenna", val),
        txPower, setTxPower: (val) => updateConfig("txPower", val),
        antennaHeight, setAntennaHeight: (val) => updateConfig("antennaHeight", val),
        antennaGain, setAntennaGain: (val) => updateConfig("antennaGain", val),
        selectedCableType, setSelectedCableType: (val) => updateConfig("cableType", val),
        cableLength, setCableLength: (val) => updateConfig("cableLength", val),

        // Derived
        erp,
        cableLoss,

        // Helpers
        getAntennaHeightMeters: () => parseFloat(antennaHeight) || 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [nodeConfigs, editMode, batchNodes, selectedDevice, selectedAntenna, txPower, antennaHeight, antennaGain, selectedCableType, cableLength, erp, cableLoss]);

    return <HardwareContext.Provider value={value}>{children}</HardwareContext.Provider>;
};
