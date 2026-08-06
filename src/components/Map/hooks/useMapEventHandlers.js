import { useMapEvents } from 'react-leaflet';
import { GROUND_TYPES, toVariabilityParams } from '../../../context/EnvironmentContext';

export const useMapEventHandlers = ({
    toolMode,
    viewshed: { runAnalysis: runViewshed, setObserver: setViewshedObserver, maxDist: viewshedMaxDist },
    rfCoverage: { runAnalysis: runRF, setObserver: setRfObserver },
    rfContext // Contains height, freq, etc. from useRF facade
}) => {
    useMapEvents({
        click(e) {
            if (toolMode === 'viewshed' || toolMode === 'rf_coverage') {
                const { lat, lng } = e.latlng;

                // Common Height Logic
                const h = rfContext.getAntennaHeightMeters ? rfContext.getAntennaHeightMeters() : (rfContext.antennaHeight || 2.0);
                const dist = viewshedMaxDist || 25000;

                if (toolMode === 'viewshed') {
                    setViewshedObserver({ lat, lng, height: h });
                    runViewshed(lat, lng, h, dist);
                } else if (toolMode === 'rf_coverage') {
                    setRfObserver({ lat, lng, height: h });

                    const ground = GROUND_TYPES[rfContext.groundType] || GROUND_TYPES['Average Ground'];

                    const rfParams = {
                        freq: rfContext.freq,
                        txPower: rfContext.txPower,
                        txGain: rfContext.antennaGain,
                        txLoss: rfContext.cableLoss || 0,
                        rxLoss: 0,
                        rxGain: rfContext.nodeConfigs.B.antennaGain || 2.15,
                        rxSensitivity: rfContext.calculateSensitivity ? rfContext.calculateSensitivity() : -126,
                        bw: rfContext.bw,
                        sf: rfContext.sf,
                        cr: rfContext.cr,
                        rxHeight: rfContext.rxHeight,
                        epsilon: ground.epsilon,
                        sigma: ground.sigma,
                        climate: rfContext.climate,
                        // ITM statistical variability (ROADMAP P4-6)
                        ...toVariabilityParams(rfContext.variability)
                    };

                    runRF(lat, lng, h, dist, rfParams);
                }
            }
        }
    });
};
