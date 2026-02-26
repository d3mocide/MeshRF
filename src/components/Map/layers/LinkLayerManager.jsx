import React from 'react';
import LinkLayer from '../LinkLayer';
import LinkAnalysisPanel from '../LinkAnalysisPanel';
import { ImageOverlay } from 'react-leaflet';

const LinkLayerManager = ({
    active,
    locked,
    nodes, setNodes,
    linkStats, setLinkStats,
    coverageOverlay, setCoverageOverlay,
    propagationSettings, setPropagationSettings,
    budget, distance, units,
    onManualClick
}) => {
    // We render LinkLayer even if inactive if there are nodes?
    // Usually map clears nodes when tool changes, but if we want persistence:
    // The original MapContainer rendered LinkLayer with `active={toolMode === "link"}`.

    return (
        <>
            <LinkLayer
                nodes={nodes}
                setNodes={setNodes}
                linkStats={linkStats}
                setLinkStats={setLinkStats}
                setCoverageOverlay={setCoverageOverlay}
                active={active}
                locked={locked}
                propagationSettings={propagationSettings}
                onManualClick={onManualClick}
            />
            {coverageOverlay && (
                <ImageOverlay
                    url={coverageOverlay.url}
                    bounds={coverageOverlay.bounds}
                    opacity={0.6}
                />
            )}
            {/* Overlay Panel */}
            {nodes.length === 2 && (
                <LinkAnalysisPanel
                    nodes={nodes}
                    linkStats={linkStats}
                    budget={budget}
                    distance={distance}
                    units={units}
                    propagationSettings={propagationSettings}
                    setPropagationSettings={setPropagationSettings}
                />
            )}
        </>
    );
};

export default LinkLayerManager;
