import React, { forwardRef } from 'react';
import { Polyline, Polygon } from 'react-leaflet';
import PropTypes from 'prop-types';

const LinkPolyline = forwardRef(({ positions, color, dashArray, fresnelPolygon, isObstructed }, ref) => {
    return (
        <>
            <Polyline
                ref={ref}
                positions={positions}
                pathOptions={{
                    color: color,
                    weight: 3,
                    dashArray: dashArray
                }}
            />

            {fresnelPolygon && (
                <Polygon
                    positions={fresnelPolygon}
                    pathOptions={{
                        color: '#00f2ff',
                        fillOpacity: isObstructed ? 0.3 : 0.1,
                        weight: 1,
                        dashArray: '5,5',
                        fillColor: isObstructed ? '#ff0000' : '#00f2ff'
                    }}
                />
            )}
        </>
    );
});

LinkPolyline.propTypes = {
    positions: PropTypes.arrayOf(PropTypes.object).isRequired,
    color: PropTypes.string.isRequired,
    dashArray: PropTypes.string,
    fresnelPolygon: PropTypes.array,
    isObstructed: PropTypes.bool
};

export default LinkPolyline;
