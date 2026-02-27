import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Generic hook for managing communication with a dedicated Web Worker instance.
 * Handles lifecycle, message posting, and response handling.
 *
 * @param {Worker} workerInstance - The Worker instance to interact with.
 * @param {Function} onMessage - Callback function for worker messages.
 * @returns {Object} { isReady, postMessage, error }
 */
export const useWorkerState = (workerInstance, onMessage) => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);

    // Stable ref for the callback
    const messageHandlerRef = useRef(onMessage);
    useEffect(() => {
        messageHandlerRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!workerInstance) return;

        const handleMessage = (e) => {
            const { type, error: workerError } = e.data;

            if (workerError) {
                console.error("Worker Error:", workerError);
                setError(workerError);
            }

            if (type === 'INIT_COMPLETE') {
                setIsReady(true);
            }

            if (messageHandlerRef.current) {
                messageHandlerRef.current(e);
            }
        };

        const handleError = (e) => {
            console.error("Worker Execution Error:", e);
            setError(e.message);
        };

        workerInstance.addEventListener('message', handleMessage);
        workerInstance.addEventListener('error', handleError);

        // Initial check
        workerInstance.postMessage({ type: 'QUERY_INIT_STATUS' });

        return () => {
            workerInstance.removeEventListener('message', handleMessage);
            workerInstance.removeEventListener('error', handleError);
        };
    }, [workerInstance]);

    const postMessage = useCallback((message, transferList) => {
        if (workerInstance) {
            workerInstance.postMessage(message, transferList);
        }
    }, [workerInstance]);

    return { isReady, postMessage, error, setError };
};
