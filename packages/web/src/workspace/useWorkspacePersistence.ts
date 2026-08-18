import { useEffect, type MutableRefObject } from "react";

import { useDebouncedValue } from "../hooks/useDebouncedValue";

import { serialiseWorkspace, type Workspace } from "./workspace";
import { writeStoredWorkspace } from "./workspaceStorage";

/**
 * Keeps the stored workspace in step with the one on screen.
 *
 * Lifted out of `App` because it is the one thing there that no other part of
 * the page can observe: everything else in that component is wiring the reader
 * can see the effect of, and this is bookkeeping that only shows up on the next
 * visit. It is also the only pair of effects that has to be read together — the
 * pause below and the flush that pays for it.
 */
export const useWorkspacePersistence = (
  workspace: Workspace,
  // The latest value at the moment the page goes away, which a captured
  // `workspace` would not be: the flush is registered once and would otherwise
  // write whatever the workspace was on first render.
  latest: MutableRefObject<Workspace>,
): void => {
  // Persisted on the same pause as the parse, so a schema being typed is not
  // written to storage once per keystroke.
  const settled = useDebouncedValue(workspace);

  useEffect(() => {
    writeStoredWorkspace(serialiseWorkspace(settled));
  }, [settled]);

  // The pause is what the effect above buys, and this is what it costs: a reload
  // inside it would lose the last keystrokes. Flushed on the way out, alongside
  // the table positions the entry point flushes.
  useEffect(() => {
    const flush = (): void => {
      writeStoredWorkspace(serialiseWorkspace(latest.current));
    };

    window.addEventListener("unload", flush);
    return () => {
      window.removeEventListener("unload", flush);
    };
  }, [latest]);
};
