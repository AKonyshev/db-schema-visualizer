import { createRoot } from "react-dom/client";
import DiagramApp from "json-table-schema-visualizer/src/components/DiagramApp/DiagramApp";
import { initI18n } from "json-table-schema-visualizer/src/i18n/initI18n";
import { useCreateTheme } from "json-table-schema-visualizer/src/hooks/theme";
import { switchDocument } from "json-table-schema-visualizer/src/stores/switchDocument";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";
import { ScrollDirection } from "json-table-schema-visualizer/src/types/scrollDirection";

import { sampleSchema } from "./fixtures/sampleSchema";

// The visualizer's own stylesheet, not a copy of it: the Tailwind directives and
// the full-height rules are the same for either host, and a second file would
// only be a second thing to forget.
import "json-table-schema-visualizer/src/styles/index.css";

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

// Before anything renders — see switchDocument for why this is not optional.
// Called once rather than from an effect because this document never changes;
// when the schema starts following an editor, this moves into that flow.
switchDocument(DOCUMENT_KEY, sampleSchema.tables, sampleSchema.refs);

// Positions live in memory while dragging and are flushed on the way out, the
// same as in the extension's webview.
window.addEventListener("unload", () => {
  tableCoordsStore.saveCurrentStore();
});

const container = document.getElementById("app");

if (container !== null) {
  createRoot(container).render(<App />);
}
