import { useState, useRef, useEffect } from 'react';

export const useDraggablePanel = (initialWidth = 400, initialHeight = 650) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [panelSize, setPanelSize] = useState({
        width: isMobile ? window.innerWidth : initialWidth,
        height: isMobile ? 480 : initialHeight
    });
    const [isResizing, setIsResizing] = useState(false);
    const draggingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });
    const cleanupRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setPanelSize({ width: window.innerWidth, height: 480 });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMouseDown = (e) => {
        draggingRef.current = true;
        setIsResizing(true);
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        cleanupRef.current = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!draggingRef.current) return;

        const dx = e.clientX - lastPosRef.current.x;
        const dy = e.clientY - lastPosRef.current.y;

        lastPosRef.current = { x: e.clientX, y: e.clientY };

        setPanelSize(prev => {
            const newWidth = prev.width - dx;
            const newHeight = prev.height + dy;

            return {
                width: Math.max(400, newWidth),
                height: Math.max(300, newHeight)
            };
        });
    };

    const handleMouseUp = () => {
        draggingRef.current = false;
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        cleanupRef.current = null;
    };

    useEffect(() => {
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, []);

    return {
        isMobile,
        panelSize,
        isResizing,
        handleMouseDown
    };
};
