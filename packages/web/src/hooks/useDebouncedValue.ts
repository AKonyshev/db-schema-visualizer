import { useEffect, useState } from "react";

const DEBOUNCE_MS = 300;

// Re-parsing on every keystroke re-runs the auto-layout, so the diagram jumps
// around while a word is still being typed. Waiting for a pause costs nothing
// perceptible and skips every intermediate state.
export const useDebouncedValue = <T>(
  value: T,
  landImmediatelyWhen?: unknown,
): T => {
  const [debounced, setDebounced] = useState(value);
  const [seenTrigger, setSeenTrigger] = useState(landImmediatelyWhen);

  // Switching tabs is not typing, so it does not wait. Debouncing it would show
  // the previous tab's diagram under the new tab's document key for a third of a
  // second, and the viewer remounts on that key — it would arrange the old
  // schema's tables and file the result under the new schema's name.
  //
  // Adjusting state during render rather than in an effect, which is what React
  // documents for a value derived from a changing key: an effect would render
  // the stale value once first, which is the flash this exists to avoid.
  if (landImmediatelyWhen !== seenTrigger) {
    setSeenTrigger(landImmediatelyWhen);
    setDebounced(value);
  }

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
