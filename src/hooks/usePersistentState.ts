import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * Custom hook to synchronize React state with localStorage
 * Supports fallback default values, graceful error handling, and type safety.
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const prefixedKey = `coaviz_${key}`;

  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(prefixedKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`[usePersistentState] Error reading localStorage key "${prefixedKey}":`, e);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(prefixedKey, JSON.stringify(state));
    } catch (e) {
      console.warn(`[usePersistentState] Error writing localStorage key "${prefixedKey}":`, e);
    }
  }, [prefixedKey, state]);

  const setPersistentState: Dispatch<SetStateAction<T>> = useCallback(
    (action) => {
      setState(action);
    },
    []
  );

  return [state, setPersistentState];
}
