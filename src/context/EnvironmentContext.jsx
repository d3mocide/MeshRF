// Constants, hook, and Provider are intentionally colocated so consumers have
// a single import surface. This only costs Fast Refresh's component-only
// hot-swap granularity in dev mode (editing this file triggers a full reload
// instead of a state-preserving hot-swap) -- it has no effect on correctness
// or production builds.
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo } from 'react';

// ITM Environment Constants
export const GROUND_TYPES = {
  "Average Ground": { epsilon: 15.0, sigma: 0.005 },
  "Poor Ground": { epsilon: 4.0, sigma: 0.001 },
  "Good Ground": { epsilon: 25.0, sigma: 0.02 },
  "Fresh Water": { epsilon: 81.0, sigma: 0.01 },
  "Sea Water": { epsilon: 81.0, sigma: 5.0 },
  "City / Industrial": { epsilon: 5.0, sigma: 0.001 },
  Farmland: { epsilon: 15.0, sigma: 0.01 },
};

export const CLIMATE_ZONES = {
  1: "Equatorial",
  2: "Continental Subtropical",
  3: "Maritime Subtropical",
  4: "Desert",
  5: "Continental Temperate",
  6: "Maritime Temperate Over Land",
  7: "Maritime Temperate Over Sea",
};

const EnvironmentContext = createContext();

export const useEnvironment = () => useContext(EnvironmentContext);

export const EnvironmentProvider = ({ children }) => {
    // ITM Environmental
    const [kFactor, setKFactor] = useState(1.33); // Standard Refraction
    const [clutterHeight, setClutterHeight] = useState(0); // Forest/Urban Obstruction (m)
    const [groundType, setGroundType] = useState("Average Ground");
    const [climate, setClimate] = useState(5); // Continental Temperate

    // Coverage / Viewshed Parameters
    const [rxHeight, setRxHeight] = useState(2.0); // Receiver Height (m), default 2m (Handheld)
    const [fadeMargin, setFadeMargin] = useState(10); // Fade Margin (dB), default 10dB
    const [viewshedMaxDist, setViewshedMaxDist] = useState(25000); // Max Distance (m), default 25km

    const value = useMemo(() => ({
        kFactor, setKFactor,
        clutterHeight, setClutterHeight,
        groundType, setGroundType,
        climate, setClimate,
        rxHeight, setRxHeight,
        fadeMargin, setFadeMargin,
        viewshedMaxDist, setViewshedMaxDist
    }), [kFactor, clutterHeight, groundType, climate, rxHeight, fadeMargin, viewshedMaxDist]);

    return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
};
