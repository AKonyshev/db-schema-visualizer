// `editor.api`, not the package root: the root entry registers every language
// Monaco ships with and their workers — the TypeScript one alone is 7 MB — none
// of which DBML has any use for.
//
// The cost is that `editor.api` is the bare editor: find, folding and the rest
// are contributions, and without them Ctrl/Cmd+F is swallowed and nothing
// happens. So they come in one by one. Adding a capability here means adding its
// module; there is no bundle that has the features without the languages.
import * as monaco from "monaco-editor/editor/editor.api";
import "monaco-editor/editor/contrib/find/browser/findController";
import "monaco-editor/editor/contrib/folding/browser/folding";
import "monaco-editor/editor/contrib/multicursor/browser/multicursor";
import "monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching";
import "monaco-editor/editor/contrib/wordOperations/browser/wordOperations";
import "monaco-editor/editor/contrib/linesOperations/browser/linesOperations";
import "monaco-editor/editor/contrib/cursorUndo/browser/cursorUndo";
import "monaco-editor/editor/contrib/contextmenu/browser/contextmenu";
// `monaco-editor/editor/editor.worker`, not `.../esm/vs/...`: the package's
// `exports` map already prefixes `./esm/vs/`, so spelling it out resolves to a
// path that does not exist.
import EditorWorker from "monaco-editor/editor/editor.worker?worker";

import { DBML_LANGUAGE_ID, DBML_TOKENS } from "./dbmlLanguage";

// Called once, before the first render.
//
// The editor is imported, not loaded. The usual React wrapper ships a loader
// that fetches Monaco from a public CDN at run time: on a network that cannot
// reach it the build is green, the type check is green, the container starts,
// and the left half of the page is empty with nothing in the console to say
// why. Nothing here can make a network request, and the smoke test asserts the
// built site makes none.
export const setupMonaco = (): void => {
  // Monaco's language services run in workers. Only the core editor worker is
  // needed here: DBML has no language service, and the JSON/TS/CSS ones would
  // be dead weight in the bundle.
  self.MonacoEnvironment = {
    getWorker: () => new EditorWorker(),
  };

  monaco.languages.register({ id: DBML_LANGUAGE_ID });
  monaco.languages.setMonarchTokensProvider(DBML_LANGUAGE_ID, DBML_TOKENS);
};
