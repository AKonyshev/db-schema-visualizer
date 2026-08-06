import { useEffect, useState } from "react";

const DEBOUNCE_MS = 300;

// Re-parsing on every keystroke re-runs the auto-layout, so the diagram jumps
// around while a word is still being typed. Waiting for a pause costs nothing
// perceptible and skips every intermediate state.
export const useDebouncedValue = <T>(value: T): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [value]);

  return debounced;
};
