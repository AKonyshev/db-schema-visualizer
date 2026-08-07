import { detailLevelStore } from "./detailLevelStore";
import { stageStateStore } from "./stagesState";
import { tableCoordsStore } from "./tableCoords";
import { tableRelationsVisibilityStore } from "./tableRelationsVisibilityStore";

/**
 * Every document every per-document store remembers, forgotten. The undo of
 * `switchDocument`, over all documents at once rather than one.
 *
 * For a host that has lost its own record of which documents it had — the web
 * target, when the workspace it stored comes back unreadable and it starts
 * over. The fresh workspace numbers its first tab 1, so without this it adopts
 * `tableCoords:tab-1` from the workspace just refused: a stranger's arrangement,
 * covering whichever tables it happens to name and leaving the rest stacked at
 * one default coordinate. The host cannot clear those keys by name, because the
 * thing that would have listed them is the value it could not read.
 *
 * Storage only, so call it before switching to a document rather than after —
 * see `PersistableStore.clearAll`.
 */
/**
 * One store at a time, because the four do not share a storage: `stageState` is
 * in `sessionStorage` and the rest in `localStorage`, and a browser can refuse
 * one while serving the other. Guarding the group instead would let the first
 * refusal carry off the clears that would have worked.
 *
 * Nothing useful to do with the failure, and nothing worth interrupting the
 * reader over: the caller is usually rescuing a page before its first render.
 */
const forget = (clearAll: () => void): void => {
  try {
    clearAll();
  } catch {
    // A storage that cannot be cleared is one nothing can be written to either,
    // so what it is holding will not be read back as this document's.
  }
};

export const forgetAllDocuments = (): void => {
  forget(() => {
    tableCoordsStore.clearAll();
  });
  forget(() => {
    stageStateStore.clearAll();
  });
  forget(() => {
    detailLevelStore.clearAll();
  });
  forget(() => {
    tableRelationsVisibilityStore.clearAll();
  });
};
