import { createRoot } from "react-dom/client";
import DiagramApp from "json-table-schema-visualizer/src/components/DiagramApp/DiagramApp";
import {
  applyThemeClass,
  useCreateTheme,
} from "json-table-schema-visualizer/src/hooks/theme";
import { initI18n } from "json-table-schema-visualizer/src/i18n/initI18n";
import { PER_DOCUMENT_STORES } from "json-table-schema-visualizer/src/stores/perDocumentStores";
import { switchDocument } from "json-table-schema-visualizer/src/stores/switchDocument";
import { ScrollDirection } from "json-table-schema-visualizer/src/types/scrollDirection";
import { Theme } from "json-table-schema-visualizer/src/types/theme";
import { type JSONTableSchema } from "shared/types/tableSchema";

import { loadSchemaText } from "../catalog/loadSchemaText";
import { parseDbmlText } from "../document/parseDbmlText";
import { resolveBrowserLocale } from "../i18n/resolveBrowserLocale";

import { embedErrorText } from "./embedError";
import { parseEmbedParams } from "./embedParams";
import ExpandButton from "./ExpandButton";
import { filterSchema } from "./filterSchema";
import { useHostExpand } from "./useHostExpand";

// The visualizer's own stylesheet, the same one the full site uses: the
// Tailwind directives and the full-height rules do not change because the host
// is a frame.
import "json-table-schema-visualizer/src/styles/index.css";

// `languages` rather than `language`: the first choice may be one we do not
// have, and the reader's second choice is a better answer than English.
initI18n(resolveBrowserLocale(navigator.languages));

interface FrameProps {
  schema: JSONTableSchema | null;
  errorMessage: string | null;
  documentKey: string;
  theme: Theme;
}

/**
 * The frame, once everything it needs is in hand.
 *
 * `useCreateTheme` rather than `usePageTheme`, and that is the whole
 * difference: `usePageTheme` writes the reader's choice to `web:theme`, a key
 * shared by every page on this origin. A frame doing that would silently reset
 * the theme of the full application next door, because a documentation page
 * carries the theme its author chose, not the theme the reader did.
 */
const Frame = ({
  schema,
  errorMessage,
  documentKey,
  theme,
}: FrameProps): JSX.Element => {
  const { themeColors, setTheme, theme: current } = useCreateTheme(theme);
  const { supported, expanded, toggle } = useHostExpand();

  return (
    <DiagramApp
      schema={schema}
      schemaErrorMessage={errorMessage}
      documentKey={documentKey}
      theme={current}
      themeColors={themeColors}
      setTheme={setTheme}
      scrollDirection={ScrollDirection.UpIn}
      // The one thing a frame can do that a window cannot: ask for more room.
      // Absent unless the page around us said it knows how to give any.
      hostActions={
        supported ? (
          <ExpandButton expanded={expanded} onToggle={toggle} />
        ) : null
      }
      // The frame is as tall as the page's author made it, and the reader is
      // reading prose around it: whatever the diagram is, it has to be visible
      // without being hunted for — and it stays that way when the page gives it
      // the room it just asked for.
      autoFit
      // And it must not spend a fifth of that height on buttons the reader has
      // not reached for.
      revealToolbarOnHover
    />
  );
};

/**
 * This document's entry in every per-document store, dropped from storage.
 *
 * `switchDocument` is what computes the layout, and computing it is also what
 * writes it: `tableCoordsStore.switchTo` persists on the way through. So the
 * frame cannot avoid storing a layout by declining to save one — it has to
 * take it back out.
 *
 * Which is worth doing twice over. A diagram in a documentation page should
 * look the same to every reader and to the author who placed it, and a stored
 * layout would leave tables added to the model later piled at the origin. And
 * the site of documentation is one origin with hundreds of pages: a key per
 * frame per page accumulates against a quota shared with the full application
 * next door.
 *
 * By key rather than `forgetAllDocuments`, for that same neighbour: clearing
 * every document would take the reader's own arrangements in `/_dbml/` with it.
 *
 * Storage only — what the stores hold in memory is what this render draws.
 */
const forgetThisDocument = (documentKey: string): void => {
  for (const store of PER_DOCUMENT_STORES) {
    try {
      store.clear(documentKey);
    } catch {
      // Storage that refuses a delete is storage nothing reached either.
    }
  }
};

/**
 * Everything that has to happen before the first render, in order.
 *
 * No `unload` handler saving table positions, unlike `src/main.tsx`: dragging a
 * table still works, it just does not outlive a reload.
 */
const bootstrap = async (): Promise<void> => {
  const container = document.getElementById("app");

  if (container === null) {
    return;
  }

  const parsed = parseEmbedParams(window.location.search);

  // Light when the query could not be read at all: `useCreateTheme` defaults to
  // dark, and a dark error message in a light documentation page reads as a
  // second thing having gone wrong.
  const theme = parsed.ok ? parsed.params.theme : Theme.light;

  // Before the first paint, so the frame is never the wrong colour corrected a
  // frame later — the page around it is not going to repaint with us.
  applyThemeClass(theme);

  const root = createRoot(container);

  const render = (
    schema: JSONTableSchema | null,
    errorMessage: string | null,
    documentKey: string,
  ): void => {
    root.render(
      <Frame
        schema={schema}
        errorMessage={errorMessage}
        documentKey={documentKey}
        theme={theme}
      />,
    );
  };

  if (!parsed.ok) {
    render(null, embedErrorText(parsed.error), "embed");
    return;
  }

  const { src, tables } = parsed.params;
  const text = await loadSchemaText(src);

  if (text === null) {
    render(null, embedErrorText({ kind: "notFound", src }), `embed:${src}`);
    return;
  }

  const parsedDbml = parseDbmlText(text);

  if (parsedDbml.schema === null) {
    render(null, parsedDbml.errorMessage, `embed:${src}`);
    return;
  }

  const filtered = filterSchema(parsedDbml.schema, tables);

  // Keyed on what was asked for, not just on the file: two frames on one page
  // showing different slices of the same model are different documents as far
  // as the table layouts are concerned.
  const documentKey = `embed:${src}?${tables?.join(",") ?? ""}`;

  if (!filtered.ok) {
    render(null, embedErrorText(filtered.error), documentKey);
    return;
  }

  // Before the render rather than in an effect: `DiagramViewer` is keyed on the
  // document key, so React mounts it during the render that follows, and an
  // effect would arrive after the viewer had already read coordinates for
  // tables this document has never held any for — which is all of them, and
  // they would be piled at one point.
  switchDocument(documentKey, filtered.schema.tables, filtered.schema.refs);
  forgetThisDocument(documentKey);

  render(filtered.schema, null, documentKey);
};

// Nothing awaits this: the page is what it produces.
void bootstrap();
