import { createRoot } from "react-dom/client";
import { initI18n } from "json-table-schema-visualizer/src/i18n/initI18n";
import { forgetAllDocuments } from "json-table-schema-visualizer/src/stores/forgetAllDocuments";
import { switchDocument } from "json-table-schema-visualizer/src/stores/switchDocument";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";

import App from "./App";
import { type Catalog } from "./catalog/catalogManifest";
import { fileNameOf } from "./catalog/catalogPath";
import { loadCatalog } from "./catalog/loadCatalog";
import { loadSchemaText } from "./catalog/loadSchemaText";
import { INITIAL_DBML } from "./document/initialText";
import { parseDbmlText } from "./document/parseDbmlText";
import { setupMonaco } from "./editor/setupMonaco";
import { resolveBrowserLocale } from "./i18n/resolveBrowserLocale";
import {
  activeTab,
  createWorkspace,
  documentKeyOf,
  parseWorkspace,
  type Workspace,
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

/**
 * What the reader lands on when nothing has been stored yet.
 *
 * A deployment carrying a catalogue opens its default file: a stand built
 * around somebody's real schemas has no business greeting them with the
 * `users`/`posts` sample. Every way that can fail falls back to that sample,
 * because a first visit to an empty editor explains nothing at all.
 */
const firstVisitWorkspace = async (
  catalog: Catalog | null,
): Promise<Workspace> => {
  const path = catalog?.defaultPath ?? null;

  if (path === null) {
    return createWorkspace(INITIAL_DBML);
  }

  const text = await loadSchemaText(path);

  if (text === null) {
    return createWorkspace(INITIAL_DBML);
  }

  return createWorkspace(text, { path, title: fileNameOf(path) });
};

/**
 * Everything that has to happen before the first render, in the order it has to
 * happen in. A function because the catalogue is fetched: a module body cannot
 * wait for it without a top-level await, and the order below is not optional.
 */
const bootstrap = async (): Promise<void> => {
  // Storage outlives deployments, so anything unreadable — written by an older
  // version, or half-written, or blocked outright — becomes a fresh single-tab
  // workspace rather than a broken page. The judgement lives in `parseWorkspace`,
  // where it is tested; these lines are only what to do when it says no.
  const read = readStoredWorkspace();
  const stored = parseWorkspace(read.kind === "found" ? read.raw : null);

  // A refused workspace does not take its table layouts with it: those are filed
  // separately, under each tab's document key. The fresh one below numbers its
  // first tab 1 and would inherit `tableCoords:tab-1` from the workspace just
  // refused — a different schema's arrangement, leaving every table it does not
  // name piled at the default coordinate until the reader presses `L`. Which keys
  // were that workspace's cannot be known here, because the value that would have
  // said is the one we could not read, so all of them go.
  //
  // Not when storage refused to be read, though. A refusal leaves no workspace
  // either, but there may be one behind it — and the layouts of a workspace that
  // is merely out of reach are not ours to throw away, on this load or on any of
  // the ones that follow.
  if (read.kind !== "unreadable" && stored === null) {
    forgetAllDocuments();
  }

  // Awaited before anything renders, and only because of the line after it: a
  // catalogue that arrived late would mean the sample schema flashing up and
  // being replaced, which reads as a bug on every single load.
  const catalog = await loadCatalog();

  // A stored workspace outranks the catalogue. Someone coming back to three
  // schemas they left open gets those three, not a reset to whatever the image
  // calls its default.
  const workspace = stored ?? (await firstVisitWorkspace(catalog));

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
    createRoot(container).render(
      <App initialWorkspace={workspace} catalog={catalog} />,
    );
  }
};

// Nothing awaits this: the page is what it produces.
void bootstrap();
