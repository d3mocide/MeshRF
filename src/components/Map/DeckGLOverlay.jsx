import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { DeckLayer } from '@deck.gl-community/leaflet';

const DeckGLOverlay = ({ layers }) => {
  const map = useMap();
  const deckLayerRef = useRef(null);

  // Mount/unmount lifecycle only -- intentionally not keyed on `layers`.
  // Prop updates are handled by the effect below via setProps(), so that
  // changing layers doesn't tear down and recreate the DeckLayer instance.
  useEffect(() => {
    // Initialize DeckLayer
    if (!deckLayerRef.current) {
      deckLayerRef.current = new DeckLayer({
        layers: layers
      });
      map.addLayer(deckLayerRef.current);
    }

    return () => {
      if (deckLayerRef.current) {
        map.removeLayer(deckLayerRef.current);
        deckLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    // Update layers when props change
    if (deckLayerRef.current) {
      deckLayerRef.current.setProps({ layers });
    }
  }, [layers]);

  return null;
};

export default DeckGLOverlay;
