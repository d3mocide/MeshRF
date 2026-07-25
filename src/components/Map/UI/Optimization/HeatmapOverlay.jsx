import React from 'react';
import { Circle, useMap } from 'react-leaflet';

const HeatmapOverlay = ({ heatmapData, showHeatmap, center, radiusMeters }) => {
    const map = useMap();

    if (!heatmapData.length || !showHeatmap || !center) return null;

    return (
        <>
            {heatmapData.map((pt, i) => {
                 // Optional: Filter heatmap to circle?
                 const dist = map.distance([pt.lat, pt.lon], center);
                 if (dist > radiusMeters) return null;

                 const opacity = Math.max(0.1, pt.score / 150);
                 let color = '#ff0000';
                 if (pt.score > 80) color = '#00ff41';
                 else if (pt.score > 50) color = '#eeff00';
                 else if (pt.score > 20) color = '#ff8800';

                 return (
                    <Circle
                        key={`hm-${i}`}
                        center={[pt.lat, pt.lon]}
                        radius={75}
                        pathOptions={{
                            color: color,
                            fillColor: color,
                            fillOpacity: opacity,
                            weight: 0
                        }}
                    />
                 )
            })}
        </>
    );
};

export default HeatmapOverlay;
