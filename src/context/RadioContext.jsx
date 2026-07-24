// Hook and Provider are intentionally colocated so consumers have a single
// import surface. This only costs Fast Refresh's component-only hot-swap
// granularity in dev mode (editing this file triggers a full reload instead
// of a state-preserving hot-swap) -- it has no effect on correctness or
// production builds.
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo } from "react";
import { RADIO_PRESETS } from "../data/presets";

const RadioContext = createContext();

export const useRadio = () => useContext(RadioContext);

export const RadioProvider = ({ children }) => {
    // Radio Params (SHARED LINK PARAMETERS)
    const [selectedRadioPreset, _setSelectedRadioPreset] = useState("MESHCORE_PNW");
    const [freq, setFreq] = useState(RADIO_PRESETS.MESHCORE_PNW.freq);
    const [bw, setBw] = useState(RADIO_PRESETS.MESHCORE_PNW.bw);
    const [sf, setSf] = useState(RADIO_PRESETS.MESHCORE_PNW.sf);
    const [cr, setCr] = useState(RADIO_PRESETS.MESHCORE_PNW.cr);

    // Recalc Signal
    const [recalcTimestamp, setRecalcTimestamp] = useState(0);
    const triggerRecalc = () => setRecalcTimestamp(Date.now());

    // 1. Radio Preset Sync Logic (Synchronous)
    const setSelectedRadioPreset = (val) => {
        _setSelectedRadioPreset(val);
        const preset = RADIO_PRESETS[val];
        // If not custom, force values
        if (val !== "CUSTOM" && preset) {
            setFreq(preset.freq);
            setBw(preset.bw);
            setSf(preset.sf);
            setCr(preset.cr);
        }
    };

    const value = useMemo(() => ({
        selectedRadioPreset, setSelectedRadioPreset,
        freq, setFreq,
        bw, setBw,
        sf, setSf,
        cr, setCr,
        recalcTimestamp, triggerRecalc
    }), [selectedRadioPreset, freq, bw, sf, cr, recalcTimestamp]);

    return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
};
