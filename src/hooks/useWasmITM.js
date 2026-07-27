import { useState, useEffect, useRef } from 'react';
import createMeshRF from '../../libmeshrf/js/meshrf.js';

/**
 * Hook for Point-to-Point ITM Path Loss using Wasm
 * @param {boolean} [enabled=true] - When false, the module is not loaded. Lets
 *   always-mounted panels defer the ~MB instantiation until ITM is actually
 *   selected; flipping it to true starts the load.
 * @returns {object} - { calculatePathLoss, isReady }
 */
export const useWasmITM = (enabled = true) => {
    const [isReady, setIsReady] = useState(false);
    const wasmModuleRef = useRef(null);

    // Initialize Wasm Module
    useEffect(() => {
        if (!enabled || wasmModuleRef.current) return;

        let mounted = true;

        const loadWasm = async () => {
             try {
                const Module = await createMeshRF({
                    locateFile: (path) => {
                        if (path.endsWith('.wasm')) {
                            return `/meshrf.wasm?v=${new Date().getTime()}`;
                        }
                        return path;
                    }
                });
                
                if (mounted) {
                    wasmModuleRef.current = Module;
                    setIsReady(true);
                }
             } catch (err) {
                 console.error('Failed to load ITM Wasm:', err);
             }
        };

        loadWasm();

        return () => { mounted = false; };
    }, [enabled]);

    /**
     * Calculate Point-to-Point ITM Path Loss
     * @param {object} params
     * @param {Float32Array} params.elevationProfile - Array of elevation values (meters AMSL)
     * @param {number} params.stepSizeMeters - Distance between points
     * @param {number} params.frequencyMHz
     * @param {number} params.txHeightM - TX Antenna Height AGL
     * @param {number} params.rxHeightM - RX Antenna Height AGL
     * @param {number} params.groundEpsilon - Dielectric Constant (default 15.0)
     * @param {number} params.groundSigma - Conductivity (default 0.005)
     * @param {number} params.climate - Climate Zone (default 5)
     * @param {number} params.timePct - % of time loss is not exceeded (default 50)
     * @param {number} params.locPct - % of locations loss is not exceeded (default 50)
     * @param {number} params.sitPct - % of situations loss is not exceeded (default 50)
     * @returns {Promise<number>} - Total Path Loss in dB (or Infinity on error)
     */
    const calculatePathLoss = async ({
        elevationProfile,
        stepSizeMeters,
        frequencyMHz,
        txHeightM,
        rxHeightM,
        groundEpsilon = 15.0,
        groundSigma = 0.005,
        climate = 5,
        timePct = 50,
        locPct = 50,
        sitPct = 50
    }) => {
        if (!wasmModuleRef.current) {
            console.error('Wasm ITM module not ready');
            return Infinity;
        }

        const Module = wasmModuleRef.current;
        let profilePtr = null;
        let params = null;
        let resultVec = null;

        try {
            // 1. Allocate Memory for Elevation Profile
            const count = elevationProfile.length;
            const byteSize = count * 4; // float = 4 bytes
            profilePtr = Module._malloc(byteSize);
            Module.HEAPF32.set(elevationProfile, profilePtr / 4);

            // 2. Create LinkParameters Struct
            params = new Module.LinkParameters();
            params.frequency_mhz = frequencyMHz;
            params.tx_height_m = txHeightM;
            params.rx_height_m = rxHeightM;
            params.polarization = 1; // Vertical (LoRa)
            params.step_size_m = stepSizeMeters;
            params.N_0 = 301.0;      // Surface refractivity
            params.epsilon = groundEpsilon;
            params.sigma = groundSigma;
            params.climate = climate;
            // Statistical variability (ROADMAP P4-6); 50/50/50 = median forecast
            params.time_pct = timePct;
            params.loc_pct = locPct;
            params.sit_pct = sitPct;

            // 3. Call Wasm ITM Function
            // resultVec is a std::vector<float> of path loss values
            resultVec = Module.calculate_itm(profilePtr, count, params);

            // 4. Get Total Path Loss (Last value in vector)
            if (resultVec.size() > 0) {
                return resultVec.get(resultVec.size() - 1);
            } else {
                return Infinity;
            }

        } catch (err) {
            console.error('WASM ITM Calculation Error:', err);
            return Infinity;
        } finally {
            // 5. Cleanup Memory
            if (profilePtr) Module._free(profilePtr);
            if (params) params.delete();
            if (resultVec) resultVec.delete();
        }
    };

    return { calculatePathLoss, isReady };
};

/**
 * Standalone helper for use outside React components (if module is already loaded)
 */
export const calculateITMPathLoss = async (Module, {
        elevationProfile,
        stepSizeMeters,
        frequencyMHz,
        txHeightM,
        rxHeightM,
        groundEpsilon = 15.0,
        groundSigma = 0.005,
        climate = 5,
        timePct = 50,
        locPct = 50,
        sitPct = 50
}) => {
    let profilePtr = null;
    let params = null;
    let resultVec = null;

    try {
        const count = elevationProfile.length;
        const byteSize = count * 4;
        profilePtr = Module._malloc(byteSize);
        Module.HEAPF32.set(elevationProfile, profilePtr / 4);

        params = new Module.LinkParameters();
        params.frequency_mhz = frequencyMHz;
        params.tx_height_m = txHeightM;
        params.rx_height_m = rxHeightM;
        params.polarization = 1;
        params.step_size_m = stepSizeMeters;
        params.N_0 = 301.0;
        params.epsilon = groundEpsilon;
        params.sigma = groundSigma;
        params.climate = climate;
        // Statistical variability (ROADMAP P4-6); 50/50/50 = median forecast
        params.time_pct = timePct;
        params.loc_pct = locPct;
        params.sit_pct = sitPct;

        resultVec = Module.calculate_itm(profilePtr, count, params);

        if (resultVec.size() > 0) {
            return resultVec.get(resultVec.size() - 1);
        } else {
            return Infinity;
        }
    } catch (err) {
        console.error('WASM ITM Error:', err);
        return Infinity;
    } finally {
        if (profilePtr) Module._free(profilePtr);
        if (params) params.delete();
        if (resultVec) resultVec.delete();
    }
};
