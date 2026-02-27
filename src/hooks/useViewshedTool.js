import { useState, useCallback, useEffect, useRef } from 'react';
import { stitchElevationGrids, transformObserverCoords, calculateStitchedBounds } from '../utils/tileStitcher';
import { fetchAndDecodeTile } from '../utils/tileFetcher';
import { useWorkerState } from './useWorkerState';

// Singleton Worker instance
// Note: Vite handles `new Worker` with URL import as a dedicated chunk
const viewshedWorker = new Worker(new URL('../../libmeshrf/js/Worker.ts', import.meta.url), { type: 'module' });

export function useViewshedTool(active) {
    const [resultLayer, setResultLayer] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const analysisIdRef = useRef(null);
    const currentBoundsRef = useRef(null);

    // Callback for generic worker message handling
    const handleWorkerMessage = useCallback((e) => {
        const { type, id, result, error: workerError } = e.data;

        // Handle explicit error payload
        if (workerError) {
            console.error("Worker Payload Error:", workerError);
            if (analysisIdRef.current && id === analysisIdRef.current) {
                setIsCalculating(false);
                setError(workerError);
            }
            return;
        }

        if (type === 'CALCULATE_VIEWSHED_RESULT') {
            if (analysisIdRef.current && id === analysisIdRef.current) {
                if (currentBoundsRef.current) {
                   setResultLayer({
                       data: result,
                       width: currentBoundsRef.current.width,
                       height: currentBoundsRef.current.height,
                       bounds: currentBoundsRef.current.bounds,
                       // Pass metadata for shader (Bug 2 fix)
                       observerCoords: currentBoundsRef.current.observerCoords,
                       gsd: currentBoundsRef.current.gsd,
                       radiusPixels: currentBoundsRef.current.radiusPixels
                   });
               }
               setIsCalculating(false);
            }
        }
    }, []);

    const { isReady: workerReady, postMessage } = useWorkerState(viewshedWorker, handleWorkerMessage);

    // Clear state when tool is deactivated
    useEffect(() => {
        if (!active) {
            setResultLayer(null);
            setError(null);
        }
    }, [active]);
    
    // Helper: Lat/Lon to Tile Coordinates
    const getTile = (lat, lon, zoom) => {
        const d2r = Math.PI / 180;
        const n = Math.pow(2, zoom);
        const x = Math.floor(n * ((lon + 180) / 360));
        const y = Math.floor(n * (1 - Math.log(Math.tan(lat * d2r) + 1 / Math.cos(lat * d2r)) / Math.PI) / 2);
        return { x, y, z: zoom };
    };

    // Helper: Get Tiles covering a radius
    const getNecessaryTiles = (centerTile, lat, radiusMeters) => {
      const earthCircum = 40075017;
      const latRad = lat * Math.PI / 180;
      const tileWidthMeters = (Math.cos(latRad) * earthCircum) / Math.pow(2, centerTile.z);
      
      const radiusTiles = Math.ceil(radiusMeters / tileWidthMeters) + 1;
      
      const tiles = [];
      const maxTile = Math.pow(2, centerTile.z) - 1;

      for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
          for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
              const x = centerTile.x + dx;
              const y = centerTile.y + dy;
              
              if (y < 0 || y > maxTile) continue;
              
              let wrappedX = x;
              if (x < 0) wrappedX = maxTile + x + 1;
              if (x > maxTile) wrappedX = x - maxTile - 1;
              
              tiles.push({ x: wrappedX, y, z: centerTile.z });
          }
      }
      return { tiles, radiusTiles };
    };

    const runAnalysis = useCallback(async (latOrObserver, lonOrMaxDist, height = 2.0, maxDist = 25000) => {
        let lat, lon, actualMaxDist;
        
        if (typeof latOrObserver === 'object' && latOrObserver.lat !== undefined) {
            lat = latOrObserver.lat;
            lon = latOrObserver.lng;
            if (latOrObserver.height !== undefined) {
                height = latOrObserver.height;
            }
            actualMaxDist = lonOrMaxDist || maxDist;
        } else {
            lat = latOrObserver;
            lon = lonOrMaxDist;
            actualMaxDist = maxDist;
        }
        
        if (!workerReady) {
            let attempts = 0;
            // Simple wait (not ideal inside async, but okay for user action)
            // The hook manages 'workerReady' state which updates asynchronously.
            // If called immediately on mount, might fail.
            // We'll rely on the UI disabling the button until ready or just fail gracefully.
            if (attempts < 1) { // Placeholder logic, real logic handled by UI state mostly
                 console.warn("Worker not ready yet");
            }
        }

        setIsCalculating(true);
        setError(null);
        setResultLayer(null);
        
        const currentAnalysisId = `vs-stitch-${Date.now()}`;
        analysisIdRef.current = currentAnalysisId;
        
        try {
            const zoom = actualMaxDist > 8000 ? 10 : 12; 
            const centerTile = getTile(lat, lon, zoom);

            const latRad = lat * Math.PI / 180;
            const gsd_meters = (2 * Math.PI * 6378137 * Math.cos(latRad)) / (256 * Math.pow(2, zoom));
            
            // 1. Get Tiles
            const { tiles: targetTiles, radiusTiles: tileRadius } = getNecessaryTiles(centerTile, lat, actualMaxDist);
            
            // 2. Fetch all in parallel with progress
            let completed = 0;
            const total = targetTiles.length;
            setProgress(10);
            
            const loadedTiles = await Promise.all(targetTiles.map(async (tile) => {
                const result = await fetchAndDecodeTile(tile);
                completed++;
                setProgress(10 + Math.floor((completed / total) * 80));
                return result;
            }));
            
            const validTiles = loadedTiles.filter(t => t !== null);
            
            if (validTiles.length === 0) {
                setError("Failed to load any elevation data");
                setIsCalculating(false);
                return;
            }
            
            setProgress(95);
            
            // 3. Stitch Tiles
            const stitched = stitchElevationGrids(validTiles, centerTile, 256, tileRadius);

            // 4. Calculate Observer Position
            const observerCoords = transformObserverCoords(lat, lon, centerTile, stitched.width, stitched.height, 256, tileRadius);
            
            // 5. Calculate Bounds
            const bounds = calculateStitchedBounds(centerTile, tileRadius);
            
            const maxDistPixels = Math.floor(actualMaxDist / gsd_meters);

            currentBoundsRef.current = {
                width: stitched.width,
                height: stitched.height,
                bounds: bounds,
                observerCoords: observerCoords,
                gsd: gsd_meters,
                radiusPixels: maxDistPixels
            };
            
            if (stitched.data.byteLength === 0) {
                throw new Error("Stitched elevation buffer is empty or already detached");
            }

            // 6. Dispatch to Worker via Hook
            postMessage({
                id: currentAnalysisId,
                type: 'CALCULATE_VIEWSHED',
                payload: {
                    elevation: stitched.data,
                    width: stitched.width,
                    height: stitched.height,
                    tx_x: observerCoords.x,
                    tx_y: observerCoords.y,
                    tx_h: height,
                    max_dist: maxDistPixels,
                    gsd_meters: gsd_meters
                }
            }, [stitched.data.buffer]); 

        } catch (err) {
            console.error("Analysis Failed:", err);
            setError(err.message);
            setIsCalculating(false);
        }

    }, [workerReady, postMessage]);

    const clear = useCallback(() => {
        setResultLayer(null);
        setError(null);
    }, []);

    return { runAnalysis, resultLayer, isCalculating, progress, error, clear };
}
