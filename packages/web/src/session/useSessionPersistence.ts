import { useEffect, type MutableRefObject } from "react";

import { useDebouncedValue } from "../hooks/useDebouncedValue";

import { serialiseSession, type Session } from "./session";
import { writeStoredSession } from "./sessionStorage";

/**
 * Keeps the stored session in step with the one on screen.
 *
 * Lifted out of `App` because it is the one thing there that no other part of
 * the page can observe: everything else in that component is wiring the reader
 * can see the effect of, and this is bookkeeping that only shows up on the next
 * visit. It is also the only pair of effects that has to be read together — the
 * pause below and the flush that pays for it.
 */
export const useSessionPersistence = (
  session: Session,
  // The latest value at the moment the page goes away, which a captured
  // `session` would not be: the flush is registered once and would otherwise
  // write whatever the session was on first render.
  latest: MutableRefObject<Session>,
): void => {
  // Persisted on the same pause as the parse, so a schema being typed is not
  // written to storage once per keystroke.
  const settled = useDebouncedValue(session);

  useEffect(() => {
    writeStoredSession(serialiseSession(settled));
  }, [settled]);

  // The pause is what the effect above buys, and this is what it costs: a reload
  // inside it would lose the last keystrokes. Flushed on the way out, alongside
  // the table positions the entry point flushes.
  useEffect(() => {
    const flush = (): void => {
      writeStoredSession(serialiseSession(latest.current));
    };

    window.addEventListener("unload", flush);
    return () => {
      window.removeEventListener("unload", flush);
    };
  }, [latest]);
};
