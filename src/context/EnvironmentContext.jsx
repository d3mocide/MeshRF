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

/**
 * ITM statistical variability presets (ROADMAP P4-6).
 *
 * ITM predicts the path loss NOT exceeded for a given percentage of time,
 * locations and situations. Higher percentages produce a more conservative
 * (higher-loss, shorter-range) prediction. TYPICAL is the 50/50/50 median and
 * is the default, matching every previous release.
 */
export const RELIABILITY_MODES = {
  OPTIMISTIC: {
    id: "OPTIMISTIC",
    name: "Best Case (10%)",
    time: 10,
    loc: 10,
    sit: 10,
    description: "Maximum theoretical range. Optimistic -- do not plan against this.",
  },
  TYPICAL: {
    id: "TYPICAL",
    name: "Typical (50%)",
    time: 50,
    loc: 50,
    sit: 50,
    description: "Median prediction. The standard default for general planning.",
  },
  RELIABLE: {
    id: "RELIABLE",
    name: "Reliable (90%)",
    time: 90,
    loc: 90,
    sit: 90,
    description: "Conservative. Use when the link must hold up in poor conditions.",
  },
};

/** Fallback used whenever a stored mode id is missing or unrecognized. */
export const DEFAULT_RELIABILITY_MODE = "TYPICAL";

/**
 * Map a reliability mode to the `rfParams`/ITM keys the WASM helpers expect.
 * Falls back to the median 50/50/50 when no mode is supplied, so callers that
 * predate P4-6 keep their previous behaviour.
 * @param {Object} [variability] - A RELIABILITY_MODES entry
 * @returns {{timePct: number, locPct: number, sitPct: number}}
 */
export const toVariabilityParams = (variability) => ({
  timePct: variability?.time ?? 50,
  locPct: variability?.loc ?? 50,
  sitPct: variability?.sit ?? 50,
});

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

    // ITM statistical variability (ROADMAP P4-6)
    const [reliabilityMode, setReliabilityMode] = useState(DEFAULT_RELIABILITY_MODE);

    // Resolved time/location/situation percentages for the active mode
    const variability = useMemo(
        () => RELIABILITY_MODES[reliabilityMode] || RELIABILITY_MODES[DEFAULT_RELIABILITY_MODE],
        [reliabilityMode]
    );

    const value = useMemo(() => ({
        kFactor, setKFactor,
        clutterHeight, setClutterHeight,
        groundType, setGroundType,
        climate, setClimate,
        rxHeight, setRxHeight,
        fadeMargin, setFadeMargin,
        viewshedMaxDist, setViewshedMaxDist,
        reliabilityMode, setReliabilityMode,
        variability
    }), [kFactor, clutterHeight, groundType, climate, rxHeight, fadeMargin, viewshedMaxDist, reliabilityMode, variability]);

    return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
};
