import { createRoot } from "react-dom/client";
import { applyThemeClass } from "json-table-schema-visualizer/src/hooks/theme";
import { initI18n } from "json-table-schema-visualizer/src/i18n/initI18n";
import { forgetAllDocuments } from "json-table-schema-visualizer/src/stores/forgetAllDocuments";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";

import App from "./App";
import { type Catalog } from "./catalog/catalogManifest";
import { loadCatalog } from "./catalog/loadCatalog";
import { loadSchemaText } from "./catalog/loadSchemaText";
import { INITIAL_DBML } from "./document/initialText";
import { setupMonaco } from "./editor/setupMonaco";
import { resolveBrowserLocale } from "./i18n/resolveBrowserLocale";
import { pointStoresAtDocument } from "./session/pointStoresAtDocument";
import {
  addLocalFile,
  emptySession,
  parseSession,
  selectionAfterCatalogChange,
  type Session,
} from "./session/session";
import { readStoredSession } from "./session/sessionStorage";
import {
  preferredTheme,
  readStoredTheme,
  systemPrefersDark,
} from "./theme/preferredTheme";

// The visualizer's own stylesheet, not a copy of it: the Tailwind directives and
// the full-height rules are the same for either host, and a second file would
// only be a second thing to forget.
import "json-table-schema-visualizer/src/styles/index.css";

// `languages` rather than `language`: the first choice may be one we do not
// have, and the reader's second choice is a better answer than English.
initI18n(resolveBrowserLocale(navigator.languages));

setupMonaco();

// Before anything renders, so the first paint is not the wrong theme corrected
// a frame later. `usePageTheme` keeps it in step from here on.
applyThemeClass(preferredTheme(readStoredTheme(), systemPrefersDark()));

/**
 * What a reader lands on when nothing has been stored yet.
 *
 * A deployment carrying a catalogue starts on its default file — a stand built
 * around somebody's real schemas has no business greeting them with the
 * `users`/`posts` sample. A deployment without one puts that sample in their
 * own files, so the tree is never empty on a first visit and the interface is
 * the same interface either way.
 */
const firstVisitSession = (catalog: Catalog | null): Session => {
  // The first file when the default names none: a manifest can point at a file
  // that is not in it — `parseManifest` drops such a name rather than refusing
  // the catalogue over it — and a deployment with schemas in it should never
  // open on the sample.
  const path = catalog?.defaultPath ?? catalog?.files[0]?.path;

  if (path !== undefined) {
    return { ...emptySession(), selected: { kind: "catalog", path } };
  }

  return addLocalFile(emptySession(), "example.dbml", INITIAL_DBML);
};

/**
 * Everything that has to happen before the first render, in the order it has to
 * happen in. A function because the catalogue is fetched: a module body cannot
 * wait for it without a top-level await, and the order below is not optional.
 */
const bootstrap = async (): Promise<void> => {
  // Storage outlives deployments, so anything unreadable — written by an older
  // version, or half-written, or blocked outright — becomes a fresh session
  // rather than a broken page. The judgement lives in `parseSession`, where it
  // is tested; these lines are only what to do when it says no.
  const read = readStoredSession();
  const stored = parseSession(read.kind === "found" ? read.raw : null);

  // A refused session does not take its table layouts with it: those are filed
  // separately, under each document's own key. Left alone they would be
  // inherited by whatever document happened to be filed under the same name
  // next — a different schema's arrangement, leaving every table it does not
  // name piled at the default coordinate until the reader presses `L`. Which
  // keys were that session's cannot be known here, because the value that would
  // have said is the one we could not read, so all of them go.
  //
  // Not when storage refused to be read, though. A refusal leaves no session
  // either, but there may be one behind it — and the layouts of a session that
  // is merely out of reach are not ours to throw away, on this load or on any
  // of the ones that follow.
  if (read.kind !== "unreadable" && stored === null) {
    forgetAllDocuments();
  }

  // Awaited before anything renders, and only because of the lines after it: a
  // catalogue that arrived late would mean one document flashing up and being
  // replaced by another, which reads as a bug on every single load.
  const catalog = await loadCatalog();

  const session =
    stored === null
      ? firstVisitSession(catalog)
      : // Storage was written before this deployment existed, and the file the
        // reader left open may not be in this image at all.
        selectionAfterCatalogChange(
          stored,
          (catalog?.files ?? []).map((file) => file.path),
        );

  const selected = session.selected;

  // Fetched here rather than in the page, for the same reason as the manifest:
  // the document is what the first render draws.
  const loaded =
    selected?.kind === "catalog" ? await loadSchemaText(selected.path) : null;

  // Before anything renders — see switchDocument for why this is not optional.
  // It points the per-document stores at the document that will be selected, so
  // the viewer finds that document's saved table layout on its first mount
  // rather than another one's.
  //
  // Editing the text does not re-run it, because that would recompute the
  // auto-layout and discard whatever arrangement the reader had made. The cost
  // is that a table added afterwards has no stored position and starts at the
  // origin, on top of whatever is there, until `L` re-arranges — the same as
  // adding a table to an open file in the extension.
  if (selected !== null) {
    pointStoresAtDocument(
      session,
      selected.kind === "catalog" && loaded !== null
        ? { [selected.path]: loaded }
        : {},
      selected,
    );
  }

  // Positions live in memory while dragging and are flushed on the way out, the
  // same as in the extension's webview.
  window.addEventListener("unload", () => {
    tableCoordsStore.saveCurrentStore();
  });

  const container = document.getElementById("app");

  if (container !== null) {
    createRoot(container).render(
      <App initialSession={session} catalog={catalog} initialLoaded={loaded} />,
    );
  }
};

// Nothing awaits this: the page is what it produces.
void bootstrap();
