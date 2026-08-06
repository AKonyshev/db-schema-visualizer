import { createRoot } from "react-dom/client";
import DiagramApp from "json-table-schema-visualizer/src/components/DiagramApp/DiagramApp";
import { initI18n } from "json-table-schema-visualizer/src/i18n/initI18n";
import { useCreateTheme } from "json-table-schema-visualizer/src/hooks/theme";
import { detailLevelStore } from "json-table-schema-visualizer/src/stores/detailLevelStore";
import { stageStateStore } from "json-table-schema-visualizer/src/stores/stagesState";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";
import { tableRelationsVisibilityStore } from "json-table-schema-visualizer/src/stores/tableRelationsVisibilityStore";
import { ScrollDirection } from "json-table-schema-visualizer/src/types/scrollDirection";

import { sampleSchema } from "./fixtures/sampleSchema";

import "./styles/index.css";

const DOCUMENT_KEY = "scaffold";

// The browser adapter over the shared diagram core. It owns what the core
// deliberately does not know about: where the schema comes from, how settings
// are stored, and which language to use.
const App = (): JSX.Element => {
  const { theme, themeColors, setTheme } = useCreateTheme();

  return (
    <DiagramApp
      schema={sampleSchema}
      schemaErrorMessage={null}
      documentKey={DOCUMENT_KEY}
      theme={theme}
      themeColors={themeColors}
      setTheme={setTheme}
      scrollDirection={ScrollDirection.UpOut}
    />
  );
};

initI18n("en");

// The four per-document stores have to be pointed at the document before
// anything renders. This is not bookkeeping: `tableCoordsStore.switchTo` is
// also what computes the initial auto-layout when nothing is stored yet, so
// without it the tables keep whatever coordinates they were left with — which
// in a fresh browser means piled at the origin, half of them off-screen.
//
// One call, not a hook, because this document never changes. When the schema
// starts following an editor and tabs arrive, this becomes reactive and worth
// sharing with the extension's own switching logic.
tableCoordsStore.switchTo(DOCUMENT_KEY, sampleSchema.tables, sampleSchema.refs);
stageStateStore.switchTo(DOCUMENT_KEY);
detailLevelStore.switchTo(DOCUMENT_KEY);
tableRelationsVisibilityStore.switchTo(DOCUMENT_KEY);

// Positions live in memory while dragging and are flushed on the way out, the
// same as in the extension's webview.
window.addEventListener("unload", () => {
  tableCoordsStore.saveCurrentStore();
});

const container = document.getElementById("app");

if (container !== null) {
  createRoot(container).render(<App />);
}
