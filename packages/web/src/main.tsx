import { createRoot } from "react-dom/client";
import { initI18n } from "json-table-schema-visualizer/src/i18n/initI18n";
import { switchDocument } from "json-table-schema-visualizer/src/stores/switchDocument";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";

import App from "./App";
import { INITIAL_DBML } from "./document/initialText";
import { parseDbmlText } from "./document/parseDbmlText";
import { setupMonaco } from "./editor/setupMonaco";
import { resolveBrowserLocale } from "./i18n/resolveBrowserLocale";
import {
  activeTab,
  createWorkspace,
  documentKeyOf,
  parseWorkspace,
} from "./workspace/workspace";
import { readStoredWorkspace } from "./workspace/workspaceStorage";

// The visualizer's own stylesheet, not a copy of it: the Tailwind directives and
// the full-height rules are the same for either host, and a second file would
// only be a second thing to forget.
import "json-table-schema-visualizer/src/styles/index.css";

// `languages` rather than `language`: the first choice may be one we do not
// have, and the reader's second choice is a better answer than English.
initI18n(resolveBrowserLocale(navigator.languages));

setupMonaco();

// Storage outlives deployments, so anything unreadable — written by an older
// version, or half-written, or blocked outright — becomes a fresh single-tab
// workspace rather than a broken page. The judgement lives in `parseWorkspace`,
// where it is tested; this line is only what to do when it says no.
const workspace =
  parseWorkspace(readStoredWorkspace()) ?? createWorkspace(INITIAL_DBML);

// Before anything renders — see switchDocument for why this is not optional. It
// points the per-document stores at the tab that will be active, so the viewer
// finds that tab's saved table layout on its first mount rather than the
// previous document's.
//
// Editing the text does not re-run it, because that would recompute the
// auto-layout and discard whatever arrangement the reader had made. The cost is
// that a table added afterwards has no stored position and starts at the origin,
// on top of whatever is there, until `L` re-arranges — the same as adding a table
// to an open file in the extension.
const firstTab = activeTab(workspace);
const initial = parseDbmlText(firstTab.text);
switchDocument(
  documentKeyOf(firstTab),
  initial.schema?.tables ?? [],
  initial.schema?.refs ?? [],
);

// Positions live in memory while dragging and are flushed on the way out, the
// same as in the extension's webview.
window.addEventListener("unload", () => {
  tableCoordsStore.saveCurrentStore();
});

const container = document.getElementById("app");

if (container !== null) {
  createRoot(container).render(<App initialWorkspace={workspace} />);
}
