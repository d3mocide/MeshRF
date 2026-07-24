import React, { createContext, useContext, useEffect, useMemo } from "react";
import { UIProvider, useUI } from "./UIContext";
import { EnvironmentProvider, useEnvironment, GROUND_TYPES, CLIMATE_ZONES } from "./EnvironmentContext";
import { RadioProvider, useRadio } from "./RadioContext";
import { HardwareProvider, useHardware } from "./HardwareContext";
import { RADIO_PRESETS } from "../data/presets";
import { calculateLoRaSensitivity } from "../utils/rfMath";

// Re-export constants for backward compatibility
export { GROUND_TYPES, CLIMATE_ZONES };

const RFContext = createContext();

export const useRF = () => {
    const context = useContext(RFContext);
    if (!context) {
        throw new Error("useRF must be used within an RFProvider");
    }
    return context;
};

const RFContent = ({ children }) => {
    const ui = useUI();
    const env = useEnvironment();
    const radio = useRadio();
    const hardware = useHardware();

    // Glue Logic: Update TX Power when Radio Preset changes (if preset has power).
    // Intentionally keyed only on the preset id -- including `hardware` would
    // re-fire this effect on every hardware update, including the one it just made.
    useEffect(() => {
        const preset = RADIO_PRESETS[radio.selectedRadioPreset];
        if (radio.selectedRadioPreset !== "CUSTOM" && preset?.power) {
             hardware.updateConfig("txPower", preset.power);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [radio.selectedRadioPreset]);

    const value = useMemo(() => ({
        ...ui,
        ...env,
        ...radio,
        ...hardware,
        // Helpers
        calculateSensitivity: () => calculateLoRaSensitivity(radio.sf, radio.bw),
    }), [ui, env, radio, hardware]);

    return <RFContext.Provider value={value}>{children}</RFContext.Provider>;
};

export const RFProvider = ({ children }) => {
    return (
        <UIProvider>
            <EnvironmentProvider>
                <RadioProvider>
                    <HardwareProvider>
                        <RFContent>{children}</RFContent>
                    </HardwareProvider>
                </RadioProvider>
            </EnvironmentProvider>
        </UIProvider>
    );
};
