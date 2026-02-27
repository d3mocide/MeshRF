import { RF_CONSTANTS } from "../rfConstants";
import * as turf from "@turf/turf";

/**
 * Calculate the radius of the nth Fresnel Zone
 * @param {number} distanceKm - Total link distance in Kilometers
 * @param {number} freqMHz - Frequency in MHz
 * @param {number} pointDistKm - Distance from one end to the point of interest (default: midpoint)
 * @returns {number} Radius in meters
 */
export const calculateFresnelRadius = (
  distanceKm,
  freqMHz,
  pointDistKm = null,
) => {
  if (!pointDistKm) pointDistKm = distanceKm / 2;
  const d1 = pointDistKm;
  const d2 = distanceKm - pointDistKm;
  const fGHz = freqMHz / 1000;

  // r = 17.32 * sqrt((d1 * d2) / (f * D))
  // d1, d2, D in km, f in GHz, r in meters
  return RF_CONSTANTS.FRESNEL.CONST_METERS * Math.sqrt((d1 * d2) / (fGHz * distanceKm));
};

/**
 * Calculate Fresnel Zone Polygon coordinates
 * @param {Object} p1 - Start {lat, lng}
 * @param {Object} p2 - End {lat, lng}
 * @param {number} freqMHz - Frequency
 * @param {number} steps - Number of steps for the polygon
 * @returns {Array} List of [lat, lng] arrays for Leaflet Polygon
 */
export const calculateFresnelPolygon = (p1, p2, freqMHz, steps = 30) => {
  const startPt = turf.point([p1.lng, p1.lat]);
  const endPt = turf.point([p2.lng, p2.lat]);
  const totalDistance = turf.distance(startPt, endPt, { units: "kilometers" });
  const bearing = turf.bearing(startPt, endPt);

  const leftSide = [];
  const rightSide = [];

  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const dist = totalDistance * fraction;

    const rMeters = calculateFresnelRadius(totalDistance, freqMHz, dist);
    const rKm = rMeters / 1000;

    const pointOnLine = turf.destination(startPt, dist, bearing, {
      units: "kilometers",
    });

    const leftPt = turf.destination(pointOnLine, rKm, bearing - 90, {
      units: "kilometers",
    });
    const rightPt = turf.destination(pointOnLine, rKm, bearing + 90, {
      units: "kilometers",
    });

    leftSide.push(leftPt.geometry.coordinates.reverse());
    rightSide.unshift(rightPt.geometry.coordinates.reverse());
  }

  return [...leftSide, ...rightSide];
};
