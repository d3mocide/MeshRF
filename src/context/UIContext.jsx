import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
    // Helper for Environment Variables
    const getEnv = (key, fallback) => {
        if (window._env_ && window._env_[key]) return window._env_[key];
        if (import.meta.env[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
        return fallback;
    };

    const [sidebarIsOpen, setSidebarIsOpen] = useState(window.innerWidth > 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [toolMode, setToolMode] = useState('link'); // 'link', 'optimize', 'viewshed', 'rf_coverage', 'none'
    const [showBatchPanel, setShowBatchPanel] = useState(false);

    // Preferences
    const [units, setUnits] = useState(getEnv('DEFAULT_UNITS', 'imperial'));
    const [mapStyle, setMapStyle] = useState(getEnv('DEFAULT_MAP_STYLE', 'dark_green'));

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
