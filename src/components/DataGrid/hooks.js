import { useState, useEffect, useRef, useCallback } from 'react';

export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export function useThrottle(callback, delay) {
    const timeoutRef = useRef(null);
    const lastExecutedRef = useRef(0);
    const callbackRef = useRef(callback);

    useEffect(() => { callbackRef.current = callback; }, [callback]);

    const throttledCallback = useCallback((...args) => {
        const now = Date.now();
        const timeSinceLastExecution = now - lastExecutedRef.current;

        if (!timeoutRef.current && timeSinceLastExecution >= delay) {
            callbackRef.current(...args);
            lastExecutedRef.current = now;
        } else if (!timeoutRef.current) {
            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
                lastExecutedRef.current = Date.now();
                timeoutRef.current = null;
            }, delay - timeSinceLastExecution);
        }
    }, [delay]);

    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

    return throttledCallback;
}