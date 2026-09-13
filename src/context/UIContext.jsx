// Hook and Provider are intentionally colocated so consumers have a single
// import surface. This only costs Fast Refresh's component-only hot-swap
// granularity in dev mode (editing this file triggers a full reload instead
// of a state-preserving hot-swap) -- it has no effect on correctness or
// production builds.
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getRuntimeConfig } from '../utils/runtimeConfig';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
    const [sidebarIsOpen, setSidebarIsOpen] = useState(window.innerWidth > 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [toolMode, setToolMode] = useState('link'); // 'link', 'optimize', 'viewshed', 'rf_coverage', 'none'
    const [showBatchPanel, setShowBatchPanel] = useState(false);

    // Preferences
    const [units, setUnits] = useState(getRuntimeConfig('DEFAULT_UNITS', 'imperial'));
    const [mapStyle, setMapStyle] = useState(getRuntimeConfig('DEFAULT_MAP_STYLE', 'dark_green'));

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const value = useMemo(() => ({
        sidebarIsOpen, setSidebarIsOpen,
        isMobile,
        toolMode, setToolMode,
        showBatchPanel, setShowBatchPanel,
        units, setUnits,
        mapStyle, setMapStyle
    }), [sidebarIsOpen, isMobile, toolMode, showBatchPanel, units, mapStyle]);

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
