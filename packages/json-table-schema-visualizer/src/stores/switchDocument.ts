import { detailLevelStore } from "./detailLevelStore";
import { stageStateStore } from "./stagesState";
import { tableCoordsStore } from "./tableCoords";
import { tableRelationsVisibilityStore } from "./tableRelationsVisibilityStore";

import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";

// Every per-document store, pointed at one document in one call.
//
// The sequence is not bookkeeping and the order inside it matters:
// `tableCoordsStore.switchTo` flushes the outgoing document's positions before it
// recovers the incoming one's, and computes a fresh auto-layout when there is
// nothing stored. Miss it and the tables keep the previous document's
// coordinates — which on a first visit means piled wherever they were left,
// with no error anywhere to say so.
//
// It lived in three places before this: twice in the extension's schema hook
// (bootstrap and message paths) and once in the web entry point.
export const switchDocument = (
  documentKey: string,
  tables: JSONTableTable[],
  refs: JSONTableRef[],
): void => {
  tableCoordsStore.switchTo(documentKey, tables, refs);
  stageStateStore.switchTo(documentKey);
  detailLevelStore.switchTo(documentKey);
  tableRelationsVisibilityStore.switchTo(documentKey);
};
