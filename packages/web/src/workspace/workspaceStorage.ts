// Deliberately not routed through the visualizer's `PersistableStore`. That
// class parses JSON for its caller, which would move the decision about
// unreadable storage out of `parseWorkspace` — where it is tested — and into a
// `JSON.parse` that throws. These two functions hand over the raw string and
// keep every judgement about its contents in one pure place. What they do
// decide is what the read itself did, which nothing else is in a position to
// know.
const WORKSPACE_KEY = "web:workspace";

/**
 * What reading storage found.
 *
 * `empty` and `unreadable` both leave the caller with no workspace to restore,
 * and they are still worth telling apart: nothing stored means the keys lying
 * around belong to nobody, while a refusal means there may be a workspace
 * behind it whose documents are not anyone's to throw away.
 */
export type StoredWorkspace =
  | { kind: "found"; raw: string }
  | { kind: "empty" }
  | { kind: "unreadable" };

/**
 * The stored workspace as it was written, unparsed.
 *
 * Reading can throw rather than return null: Safari's private mode and a
 * browser configured to block site data both raise on access. A reader who
 * cannot be given their previous tabs should still get a working page.
 */
export const readStoredWorkspace = (): StoredWorkspace => {
  let raw: string | null;

  try {
    raw = window.localStorage.getItem(WORKSPACE_KEY);
  } catch {
    return { kind: "unreadable" };
  }

  return raw === null ? { kind: "empty" } : { kind: "found", raw };
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
