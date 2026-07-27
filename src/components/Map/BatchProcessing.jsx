import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useRF, GROUND_TYPES } from '../../context/RFContext';
import { fetchElevationPath } from '../../utils/elevation';
import { analyzeLinkProfile, calculateLinkBudget, calculateBullingtonDiffraction } from '../../utils/rfMath';
import { parseBatchNodesCSV } from '../../utils/csvParser';
import { resolveNodeConfig } from '../../utils/nodeConfig';
import { csvEscape, downloadTextFile, downloadBatchNodesTemplate } from '../../utils/csvImportExport';
import { useWasmITM } from '../../hooks/useWasmITM';

/**
 * Elevation samples per link. ITM needs a denser profile to resolve terrain
 * (the backend uses 100 for the same reason); Bullington stays coarse so large
 * meshes remain quick.
 */
const PROFILE_SAMPLES = {
    bullington: 20,
    itm_wasm: 100,
};

const BatchProcessing = () => {
    const {
        batchNodes, setBatchNodes,
        setShowBatchPanel,
        freq, nodeConfigs,
        kFactor, clutterHeight,
        sf, bw, fadeMargin,
        groundType, climate,
        isMobile, sidebarIsOpen
    } = useRF();

    const [batchNotification, setBatchNotification] = useState(null); // { message, type }
    const [showHelp, setShowHelp] = useState(false);
    const [batchModel, setBatchModel] = useState('bullington');
    const [progress, setProgress] = useState(null); // { done, total }
    const fileInputRef = useRef(null);

    // WASM ITM for terrain-aware batch reports (ROADMAP P3-3).
    // Loaded lazily -- this panel is always mounted, so the module is only
    // instantiated once the user actually selects the ITM model.
    const itmSelected = batchModel === 'itm_wasm';
    const { calculatePathLoss: calculateITM, isReady: itmReady } = useWasmITM(itmSelected);

    useEffect(() => {
        if (batchNotification) {
            const timer = setTimeout(() => {
                setBatchNotification(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [batchNotification]);

    /**
     * Analyse a single node pair and return its CSV row fields.
     * Falls back from ITM to Bullington per-link if the WASM call fails, so one
     * bad profile doesn't sink the whole report.
     */
    const analyzePair = useCallback(async (n1, n2, useITM) => {
        const samples = useITM ? PROFILE_SAMPLES.itm_wasm : PROFILE_SAMPLES.bullington;
        const profile = await fetchElevationPath(
            { lat: n1.lat, lng: n1.lng },
            { lat: n2.lat, lng: n2.lng },
            samples
        );

        // Need at least two points to derive a step size / distance
        if (!profile || profile.length < 2) return null;

        const cfgA = resolveNodeConfig(n1, nodeConfigs.A);
        const cfgB = resolveNodeConfig(n2, nodeConfigs.B);

        const analysis = analyzeLinkProfile(
            profile,
            freq,
            cfgA.antennaHeight,
            cfgB.antennaHeight,
            kFactor,
            clutterHeight
        );

        const distKm = profile[profile.length - 1].distance;

        let pathLossOverride = null;
        let excessLoss = 0;
        let modelUsed = 'Bullington';

        if (useITM) {
            try {
                const ground = GROUND_TYPES[groundType] || GROUND_TYPES['Average Ground'];
                const totalDistMeters = distKm * 1000;
                const loss = await calculateITM({
                    elevationProfile: new Float32Array(profile.map((p) => p.elevation)),
                    stepSizeMeters: totalDistMeters / (profile.length - 1),
                    frequencyMHz: freq,
                    txHeightM: cfgA.antennaHeight,
                    rxHeightM: cfgB.antennaHeight,
                    groundEpsilon: ground.epsilon,
                    groundSigma: ground.sigma,
                    climate,
                });

                if (Number.isFinite(loss)) {
                    pathLossOverride = loss;
                    modelUsed = 'ITM';
                }
            } catch (e) {
                console.error('Batch ITM failed, falling back to Bullington', e);
            }
        }

        if (pathLossOverride === null) {
            // FSPL + Bullington diffraction (terrain-aware, no WASM required)
            excessLoss = analysis.profileWithStats
                ? calculateBullingtonDiffraction(
                    analysis.profileWithStats,
                    freq,
                    cfgA.antennaHeight,
                    cfgB.antennaHeight
                )
                : 0;
        }

        const budget = calculateLinkBudget({
            txPower: cfgA.txPower,
            txGain: cfgA.antennaGain,
            txLoss: cfgA.loss,
            rxGain: cfgB.antennaGain,
            rxLoss: cfgB.loss,
            distanceKm: distKm,
            freqMHz: freq,
            sf, bw,
            pathLossOverride,
            excessLoss,
            fadeMargin,
        });

        const status = analysis.isObstructed
            ? 'OBSTRUCTED'
            : (budget.margin > 10 ? 'GOOD' : 'MARGINAL');

        return [
            n1.name,
            n2.name,
            distKm.toFixed(3),
            status,
            analysis.linkQuality,
            budget.margin,
            analysis.minClearance,
            modelUsed,
            // budget.fspl carries the override when one was supplied, otherwise
            // plain FSPL -- diffraction is billed separately as excessLoss.
            (pathLossOverride !== null ? pathLossOverride : budget.fspl + excessLoss).toFixed(2),
            cfgA.antennaHeight,
            cfgB.antennaHeight,
            cfgA.antennaGain,
            cfgB.antennaGain,
            cfgA.txPower,
        ];
    }, [nodeConfigs, freq, kFactor, clutterHeight, sf, bw, fadeMargin, groundType, climate, calculateITM]);

    /** Run the all-pairs mesh report and download it as CSV. */
    const runMeshReport = useCallback(async () => {
        const useITM = batchModel === 'itm_wasm' && itmReady;
        const total = batchNodes.length * (batchNodes.length - 1) / 2;

        const header = [
            'Source', 'Target', 'Distance_km', 'Status', 'Quality', 'Margin_dB',
            'Clearance_m', 'Model', 'PathLoss_dB', 'TxHeight_m', 'RxHeight_m',
            'TxGain_dBi', 'RxGain_dBi', 'TxPower_dBm',
        ];
        const rows = [header.join(',')];

        setProgress({ done: 0, total });
        let done = 0;

        for (let i = 0; i < batchNodes.length; i++) {
            for (let j = i + 1; j < batchNodes.length; j++) {
                const n1 = batchNodes[i];
                const n2 = batchNodes[j];

                try {
                    const fields = await analyzePair(n1, n2, useITM);
                    if (fields) rows.push(fields.map(csvEscape).join(','));
                } catch (e) {
                    console.error('Batch Error', e);
                    rows.push([n1.name, n2.name, ...Array(header.length - 2).fill('ERR')]
                        .map(csvEscape).join(','));
                }

                done += 1;
                setProgress({ done, total });

                // Small delay to prevent browser freeze & rate limit
                await new Promise((r) => setTimeout(r, 200));
            }
        }

        downloadTextFile(
            rows.join('\n'),
            `mesh_rf_analysis_${new Date().toISOString().slice(0, 10)}.csv`
        );
        setProgress(null);
    }, [batchNodes, batchModel, itmReady, analyzePair]);

    const sectionStyle = {
        marginBottom: 'var(--spacing-lg)',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: 'var(--spacing-md)'
    };

    const buttonStyle = {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        color: '#fff',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.9rem',
        marginTop: '8px'
    };

    return (
        <div style={{ ...sectionStyle, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0 }}>Batch Processing</h3>
                <div 
                    onClick={() => setShowHelp(!showHelp)}
                    style={{ 
                        cursor: 'pointer', 
                        color: 'var(--color-primary)', 
                        fontSize: '14px', 
                        padding: '4px',
                        background: showHelp ? 'rgba(0, 175, 185, 0.1)' : 'transparent',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </div>
            </div>

            {/* Help Slide-down */}
            {showHelp && (
                <div style={{
                    position: 'absolute',
                    top: '32px',
                    left: '0',
                    right: '0',
                    background: 'rgba(20, 25, 40, 0.98)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--color-primary)',
                    borderRadius: '8px',
                    padding: '12px',
                    zIndex: 1010,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                    fontSize: '0.85em',
                    lineHeight: '1.4',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    animation: 'slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '6px' }}>Batch Guide</div>
                    <div style={{ color: '#ccc', marginBottom: '8px' }}>
                        Perform link budget analysis for large groups of nodes simultaneously.
                    </div>
                    <ul style={{ paddingLeft: '18px', margin: '0 0 8px 0', color: '#bbb' }}>
                        <li><strong>CSV Import:</strong> Upload a file with <code>Name, Lat, Lon</code>.</li>
                        <li>
                            <strong>Per-Node Config:</strong> Optionally add
                            {' '}<code>Antenna_Height</code>, <code>Antenna_Gain</code>,
                            {' '}<code>TX_Power</code>, <code>Device</code>, <code>Antenna</code>.
                            Blank cells fall back to the global A/B config.
                        </li>
                        <li><strong>Model:</strong> Bullington is fast; ITM is terrain-accurate and matches Link Analysis.</li>
                        <li><strong>Mesh Report:</strong> Analyzes every possible point-to-point link between all loaded nodes.</li>
                        <li><strong>Results:</strong> Detailed CSV including path loss, margin, clearance, and the per-node params used.</li>
                    </ul>
                    <button 
                        onClick={() => setShowHelp(false)}
                        style={{ marginTop: '10px', width: '100%', background: 'rgba(0, 175, 185, 0.1)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Got it
                    </button>
                </div>
            )}
            
            {/* Import */}
            <div style={{marginBottom: '8px'}}>
                <label htmlFor="csv-upload" style={{display: 'block', padding: '6px 10px', background: '#333', color: '#ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em', textAlign: 'center'}}>
                    Import Nodes (CSV)
                    <input 
                    id="csv-upload"
                    name="csv-upload"
                    ref={fileInputRef}
                    type="file" 
                    accept=".csv"
                    style={{display: 'none'}}
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const text = event.target.result;
                                try {
                                    const newNodes = parseBatchNodesCSV(text);
                                    if (newNodes.length > 0) {
                                        setBatchNodes(newNodes);
                                        setShowBatchPanel(true);
                                        setBatchNotification({ type: 'success', message: `Successfully loaded ${newNodes.length} nodes.` });
                                    } else {
                                        setBatchNotification({ type: 'error', message: 'No valid nodes found in CSV.' });
                                    }
                                } catch (err) {
                                    console.error("CSV Parse Error", err);
                                    setBatchNotification({ type: 'error', message: 'Failed to parse CSV file.' });
                                }

                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            };
                            reader.readAsText(file);
                        }
                    }}
                    />
                </label>
                <div style={{fontSize: '0.7em', color: '#666', marginTop: '4px'}}>
                Format: Name, Lat, Lon (+ optional per-node columns)
                <span style={{color: '#444', margin: '0 4px'}}>|</span>
                <button
                    type="button"
                    onClick={downloadBatchNodesTemplate}
                    style={{
                        color: 'var(--color-primary)',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        font: 'inherit',
                        textDecoration: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Download Template
                </button>
                </div>
            </div>

            {/* Propagation model for the mesh report (ROADMAP P3-3) */}
            {batchNodes.length > 1 && (
                <div style={{ marginBottom: '8px' }}>
                    <label
                        htmlFor="batch-model"
                        style={{ display: 'block', fontSize: '0.7em', color: '#888', marginBottom: '4px' }}
                    >
                        Propagation Model
                    </label>
                    <select
                        id="batch-model"
                        value={batchModel}
                        onChange={(e) => setBatchModel(e.target.value)}
                        disabled={progress !== null}
                        style={{
                            width: '100%',
                            background: '#1a1a1a',
                            color: '#fff',
                            border: '1px solid #444',
                            padding: '4px',
                            borderRadius: '4px',
                            fontSize: '0.8em'
                        }}
                    >
                        <option value="bullington">Bullington (Fast)</option>
                        <option value="itm_wasm">Longley-Rice ITM (Accurate, Slower)</option>
                    </select>
                    <div style={{ fontSize: '0.65em', color: '#666', marginTop: '4px' }}>
                        {!itmSelected && 'FSPL + knife-edge diffraction on 20-point profiles.'}
                        {itmSelected && itmReady &&
                            'Full terrain-aware ITM, matching Link Analysis. Uses 100-point profiles.'}
                        {itmSelected && !itmReady && (
                            <span style={{ color: '#ffbf00' }}>Loading ITM engine...</span>
                        )}
                    </div>
                </div>
            )}

            {/* Export Report */}
            {batchNodes.length > 1 && (
                <button
                disabled={progress !== null || (itmSelected && !itmReady)}
                style={{
                    ...buttonStyle,
                    background: (progress !== null || (itmSelected && !itmReady)) ? '#444' : '#00afb9',
                    width: '100%',
                    cursor: progress !== null ? 'wait' : 'pointer'
                }}
                onClick={async () => {
                        const totalLinks = batchNodes.length * (batchNodes.length - 1) / 2;
                        const modelNote = batchModel === 'itm_wasm' ? ' using ITM' : '';
                        if (batchNodes.length > 20 && !window.confirm(`Preparing to analyze ${totalLinks} links${modelNote}. This may take a while. Continue?`)) return;

                        try {
                            await runMeshReport();
                        } catch (e) {
                            console.error('Mesh report failed', e);
                            setProgress(null);
                            setBatchNotification({ type: 'error', message: 'Mesh report failed. See console for details.' });
                        }
                }}
                >
                    {progress && `Analyzing ${progress.done}/${progress.total}...`}
                    {!progress && itmSelected && !itmReady && 'Loading ITM Engine...'}
                    {!progress && !(itmSelected && !itmReady) && 'Export Mesh Report'}
                </button>
            )}

            {/* Mesh report progress */}
            {progress && progress.total > 0 && (
                <div style={{ marginTop: '6px' }}>
                    <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${(progress.done / progress.total) * 100}%`,
                                background: 'var(--color-primary)',
                                transition: 'width 0.2s linear'
                            }}
                        />
                    </div>
                </div>
            )}

            {batchNodes.length > 0 && (
                <div style={{fontSize: '0.75em', color: '#888', marginTop: '4px'}}>
                    {batchNodes.length} Nodes Loaded
                    {batchNodes.some((n) => n.config) && (
                        <span style={{ color: 'var(--color-primary)' }}>
                            {' '}({batchNodes.filter((n) => n.config).length} with per-node config)
                        </span>
                    )}
                </div>
            )}

            {/* Batch Import Notification Overlay */}
            {batchNotification && (
                <div style={{
                    position: 'fixed', 
                    top: '50%', 
                    // Center in the map area (assuming sidebar is ~320px)
                    left: (!isMobile && sidebarIsOpen) ? 'calc(50% + 160px)' : '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(10, 10, 15, 0.95)', 
                    color: batchNotification.type === 'success' ? '#4ade80' : '#f87171',
                    padding: '30px 50px', 
                    borderRadius: '16px', 
                    border: batchNotification.type === 'success' ? '1px solid rgba(50, 255, 100, 0.3)' : '1px solid rgba(255, 50, 50, 0.3)',
                    boxShadow: batchNotification.type === 'success' 
                        ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 30px rgba(50, 255, 100, 0.1)' 
                        : '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 50, 50, 0.1)',
                    zIndex: 3000,
                    textAlign: 'center',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    minWidth: '280px'
                }}>
                    <div style={{
                        width: '48px', height: '48px',
                        borderRadius: '50%',
                        background: batchNotification.type === 'success' ? 'rgba(50, 255, 100, 0.1)' : 'rgba(255, 50, 50, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: batchNotification.type === 'success' ? '2px solid rgba(50, 255, 100, 0.2)' : '2px solid rgba(255, 50, 50, 0.2)'
                    }}>
                        {batchNotification.type === 'success' ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        )}
                    </div>
                    
                    <div style={{ fontSize: '1.1em', fontWeight: '700', color: '#fff' }}>
                        {batchNotification.type === 'success' ? 'IMPORT SUCCESSFUL' : 'IMPORT FAILED'}
                    </div>
                    <div style={{ fontSize: '0.9em', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {batchNotification.message}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchProcessing;
