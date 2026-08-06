import { createRoot } from "react-dom/client";
import { initI18n } from "json-table-schema-visualizer/src/i18n/initI18n";
import { switchDocument } from "json-table-schema-visualizer/src/stores/switchDocument";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";

import App, { DOCUMENT_KEY } from "./App";
import { INITIAL_DBML } from "./document/initialText";
import { parseDbmlText } from "./document/parseDbmlText";
import { resolveBrowserLocale } from "./i18n/resolveBrowserLocale";

// The visualizer's own stylesheet, not a copy of it: the Tailwind directives and
// the full-height rules are the same for either host, and a second file would
// only be a second thing to forget.
import "json-table-schema-visualizer/src/styles/index.css";

// `languages` rather than `language`: the first choice may be one we do not
// have, and the reader's second choice is a better answer than English.
initI18n(resolveBrowserLocale(navigator.languages));

// Before anything renders — see switchDocument for why this is not optional. It
// runs once, with the text the editor starts on: the stores are keyed by
// document, and this session has one.
//
// Editing the text does not re-run it, because that would recompute the
// auto-layout and discard whatever arrangement the reader had made. The cost is
// that a table added afterwards has no stored position and starts at the origin,
// on top of whatever is there, until `L` re-arranges — the same as adding a table
// to an open file in the extension.
const initial = parseDbmlText(INITIAL_DBML);
switchDocument(
  DOCUMENT_KEY,
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
  createRoot(container).render(<App />);
}
