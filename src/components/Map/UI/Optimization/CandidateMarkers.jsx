import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const createRankedIcon = (rank) => L.divIcon({
    className: 'ghost-icon',
    html: `<div style="
        background-color: #00f2ff;
        width: 24px; height: 24px;
        border-radius: 50%;
        border: 2px solid #00f2ff;
        display: flex; align-items: center; justify-content: center;
        color: #0a0a0f; font-weight: bold; font-family: monospace; font-size: 14px;
        box-shadow: 0 0 10px rgba(0, 242, 255, 0.8);
    ">${rank}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const CandidateMarkers = ({ ghostNodes, setSelectedNode }) => {
    return (
        <>
            {ghostNodes.map((node, i) => (
                <Marker
                    key={i}
                    position={[node.lat, node.lon]}
                    icon={createRankedIcon(i + 1)}
                    eventHandlers={{ click: () => setSelectedNode(node) }}
                >
                    <Popup>
                        <strong>Best Signal #{i+1}</strong><br/>
                        Score: {node.score}<br/>
                        <span style={{ fontSize: '0.8em', color: '#00f2ff', cursor: 'pointer' }}>Click to view profile</span>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default CandidateMarkers;
