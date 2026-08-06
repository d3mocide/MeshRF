import { useState, useRef } from 'react';
import { useRF } from '../../../context/RFContext';
import { calculateLinkBudget } from '../../../utils/rfMath';
import { DEVICE_PRESETS } from '../../../data/presets';
import * as turf from '@turf/turf';

export const useLinkTool = () => {
    const {
        nodeConfigs,
        freq, sf, bw, fadeMargin,
        setEditMode
    } = useRF();

    const [nodes, setNodes] = useState([]);
    const [linkStats, setLinkStats] = useState({
        minClearance: 0,
        isObstructed: false,
        loading: false,
    });
    const [isLinkLocked, setIsLinkLocked] = useState(false);
    const [selectedBatchNodes, setSelectedBatchNodes] = useState([null, null]); // [TX, RX]

    // Propagation Model State (Local to Link Tool)
    const [propagationSettings, setPropagationSettings] = useState({
        model: "itm_wasm",
        environment: "suburban",
    });

    const selectionRef = useRef(0);

    // Calculate Budget & Distance
    let budget = null;
    let distance = 0;

    if (nodes.length === 2) {
        const [p1, p2] = nodes;
        distance = turf.distance([p1.lng, p1.lat], [p2.lng, p2.lat], {
            units: "kilometers",
        });

        // Determine Path Loss logic
        const configA = nodeConfigs.A;
        const configB = nodeConfigs.B;

        let pathLossVal = linkStats.backendPathLoss || null;

        budget = calculateLinkBudget({
            txPower: configA.txPower,
            txGain: configA.antennaGain,
            txLoss: DEVICE_PRESETS[configA.device]?.loss || 0,
            rxGain: configB.antennaGain,
            rxLoss: DEVICE_PRESETS[configB.device]?.loss || 0,
            distanceKm: distance,
            freqMHz: freq,
            sf,
            bw,
            pathLossOverride: pathLossVal,
            fadeMargin
        });
    }

    const handleNodeSelect = (node, isBatch = false) => {
        // Temporal guard
        const now = Date.now();
        if (now - selectionRef.current < 100) return;
        selectionRef.current = now;

        const isNewLink = nodes.length === 0 || nodes.length >= 2;
        const nodeData = {
            lat: node.lat,
            lng: node.lng,
            isBatch,
            batchId: isBatch ? node.id : null,
        };

        if (isNewLink) {
            setNodes([nodeData]);
            setEditMode("A");
            setSelectedBatchNodes([
                isBatch
                  ? { id: node.id, name: node.name, role: "TX" }
                  : { id: "manual-tx", role: "TX" },
                null,
            ]);
        } else {
            setNodes((prev) => [...prev, nodeData]);
            setEditMode("B");
            setSelectedBatchNodes((prev) => [
                prev[0],
                isBatch
                  ? { id: node.id, name: node.name, role: "RX" }
                  : { id: "manual-rx", role: "RX" },
            ]);
        }
    };

    const reset = () => {
        setNodes([]);
        setIsLinkLocked(false);
        setLinkStats({ minClearance: 0, isObstructed: false, loading: false });
        setSelectedBatchNodes([null, null]);
        setEditMode("GLOBAL");
    };

    return {
        nodes, setNodes,
        linkStats, setLinkStats,
        isLinkLocked, setIsLinkLocked,
        selectedBatchNodes, setSelectedBatchNodes,
        propagationSettings, setPropagationSettings,
        budget,
        distance,
        handleNodeSelect,
        reset
    };
};
