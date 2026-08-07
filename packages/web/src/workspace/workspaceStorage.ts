// Deliberately not routed through the visualizer's `PersistableStore`. That
// class parses JSON for its caller, which would move the decision about
// unreadable storage out of `parseWorkspace` — where it is tested — and into a
// `JSON.parse` that throws. These two functions hand over the raw string and
// keep every judgement about it in one pure place.
const WORKSPACE_KEY = "web:workspace";

/**
 * The stored workspace as it was written, or `null` when there is nothing to
 * read.
 *
 * Reading can throw rather than return null: Safari's private mode and a
 * browser configured to block site data both raise on access. A reader who
 * cannot be given their previous tabs should still get a working page.
 */
export const readStoredWorkspace = (): string | null => {
  try {
    return window.localStorage.getItem(WORKSPACE_KEY);
  } catch {
    return null;
  }
};

/**
 * Writing is best-effort for the same reasons, plus one more: the quota. A
 * workspace of large schemas can exceed it, and losing the ability to restore
 * tabs is a far smaller loss than losing the page the reader is working in.
 */
export const writeStoredWorkspace = (serialised: string): void => {
  try {
    window.localStorage.setItem(WORKSPACE_KEY, serialised);
  } catch {
    // Nothing useful to do, and nothing worth interrupting the reader over.
  }
};
