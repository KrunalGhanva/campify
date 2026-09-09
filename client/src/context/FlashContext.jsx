import { createContext, useState, useCallback, useEffect, useRef } from 'react';

export const FlashContext = createContext();

export const FlashProvider = ({ children }) => {
    const [flash, setFlash] = useState(null); // { type: 'success' | 'danger', message: '' }
    const timeoutRef = useRef(null);

    const showFlash = useCallback((type, message) => {
        clearTimeout(timeoutRef.current);
        setFlash({ type, message });
        timeoutRef.current = setTimeout(() => setFlash(null), 5000);
    }, []);

    const clearFlash = useCallback(() => {
        clearTimeout(timeoutRef.current);
        setFlash(null);
    }, []);

    useEffect(() => () => clearTimeout(timeoutRef.current), []);

    return (
        <FlashContext.Provider value={{ flash, showFlash, clearFlash }}>
            {children}
        </FlashContext.Provider>
    );
};
