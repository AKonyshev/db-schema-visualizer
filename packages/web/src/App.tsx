import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toggleTableRefs } from "dbml-to-json-table-schema";
import DiagramApp from "json-table-schema-visualizer/src/components/DiagramApp/DiagramApp";
import { useCreateTheme } from "json-table-schema-visualizer/src/hooks/theme";
import { switchDocument } from "json-table-schema-visualizer/src/stores/switchDocument";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";
import { ScrollDirection } from "json-table-schema-visualizer/src/types/scrollDirection";

import DocumentBar from "./components/DocumentBar";
import EditorPane from "./components/EditorPane";
import SplitLayout from "./components/SplitLayout";
import TabBar from "./components/TabBar";
import ToggleRefsShortcut from "./components/ToggleRefsShortcut";
import { toDbmlFilename } from "./document/dbmlFilename";
import { downloadTextFile } from "./document/downloadTextFile";
import { parseDbmlText } from "./document/parseDbmlText";
import { writeLayoutIntoText } from "./document/writeLayoutIntoText";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useFileDrop } from "./hooks/useFileDrop";
import {
  activateTab,
  activeTab,
  addTab,
  closeTab,
  documentKeyOf,
  loadIntoActive,
  serialiseWorkspace,
  updateActiveText,
  type Workspace,
} from "./workspace/workspace";
import { writeStoredWorkspace } from "./workspace/workspaceStorage";

export interface AppProps {
  /** Restored from storage by the entry point, which has already pointed the
   * diagram's stores at the active tab. */
  initialWorkspace: Workspace;
}

// What a tab opened by the `+` button starts with. Empty rather than a copy of
// the sample schema: someone opening a second tab has already seen the sample
// and is about to paste or open something of their own.
const NEW_TAB_TEXT = "";

const App = ({ initialWorkspace }: AppProps): JSX.Element => {
  const [workspace, setWorkspace] = useState(initialWorkspace);

  // The workspace as the handlers below see it. They are stable callbacks, so
  // reading state through a closure would give them whatever it was when the
  // callback was built — which for `onChange` is the first render.
  const workspaceRef = useRef(workspace);

  const tab = activeTab(workspace);
  const documentKey = documentKeyOf(tab);

  /**
   * Every change to the workspace goes through here, because every change might
   * be a change of document.
   *
   * `switchDocument` runs in the handler rather than in an effect, and that is
   * not a preference: `DiagramViewer` is keyed on the document key, so React
   * mounts the new one during the render that follows. An effect would run after
   * that mount, and the viewer would have already read the previous document's
   * table positions. Doing it here means the stores are pointing at the new
   * document before the render begins — which is also how the extension does it,
   * from its message handler.
   */
  const changeWorkspace = useCallback((next: Workspace) => {
    const current = workspaceRef.current;
    const nextTab = activeTab(next);
    const nextKey = documentKeyOf(nextTab);

    if (nextKey !== documentKeyOf(activeTab(current))) {
      const { schema } = parseDbmlText(nextTab.text);
      switchDocument(nextKey, schema?.tables ?? [], schema?.refs ?? []);
    }

    workspaceRef.current = next;
    setWorkspace(next);
  }, []);

  // Not debounced on the document key: a tab switch must land in the same render
  // as the key, or the viewer arranges the outgoing schema's tables and files the
  // result under the incoming schema's name.
  const debouncedText = useDebouncedValue(tab.text, documentKey);
  const { schema, errorMessage } = useMemo(
    () => parseDbmlText(debouncedText),
    [debouncedText],
  );
  const { theme, themeColors, setTheme } = useCreateTheme();

  // Persisted on the same pause as the parse, so a schema being typed is not
  // written to storage once per keystroke.
  const workspaceToStore = useDebouncedValue(workspace);
  useEffect(() => {
    writeStoredWorkspace(serialiseWorkspace(workspaceToStore));
  }, [workspaceToStore]);

  // The pause is what the line above buys, and this is what it costs: a reload
  // inside it would lose the last keystrokes. Flushed on the way out, alongside
  // the table positions the entry point flushes.
  useEffect(() => {
    const flush = (): void => {
      writeStoredWorkspace(serialiseWorkspace(workspaceRef.current));
    };

    window.addEventListener("unload", flush);
    return () => {
      window.removeEventListener("unload", flush);
    };
  }, []);

  const openFile = useCallback(
    (file: File) => {
      // Decoded as UTF-8 and never sent anywhere: the read happens in the page,
      // which is what lets someone paste a production schema in without it
      // becoming a request.
      //
      // One byte does not survive the trip: `File.text()` strips a leading UTF-8
      // BOM, so a file written by a Windows editor comes back three bytes
      // shorter. Keeping it would mean carrying it as state the reader cannot
      // see, and keeping it *in the text* is worse — the parser rejects U+FEFF,
      // so the diagram would go blank for exactly those files.
      void file.text().then((contents) => {
        // A file replaces the document rather than editing it, so it can bring
        // tables this document has never held a position for — which is every
        // table when the file is opened into a fresh tab. Left alone they all
        // take the same default coordinate and land in one pile.
        //
        // `resetPositions` computes a layout and then keeps whatever stored
        // position it recognises, so reopening a file that was arranged earlier
        // still finds that arrangement. Reserved for opening a file: running it
        // on every edit would rearrange the diagram under someone mid-sentence.
        const { schema } = parseDbmlText(contents);
        if (schema !== null) {
          // A file carrying its own layout block overrules whatever this tab
          // remembered, and the stored positions have to be cleared for it to be
          // heard at all: `resetPositions` only consults a file's coordinates
          // when it finds nothing stored, and a tab opened by the `+` button has
          // already stored an empty layout for its empty document. Without this,
          // a file arranged in the extension opens on the site in a layout the
          // site invented — which is the round trip the whole format exists for.
          if (schema.tables.some((table) => table.fromMetaInfo === true)) {
            tableCoordsStore.clear(
              documentKeyOf(activeTab(workspaceRef.current)),
            );
          }

          tableCoordsStore.resetPositions(schema.tables, schema.refs);
        }

        changeWorkspace(
          loadIntoActive(workspaceRef.current, file.name, contents),
        );
      });
    },
    [changeWorkspace],
  );

  useFileDrop(openFile);

  /**
   * Both text-changing commands take the same shape, and the shape is the point:
   * read the active tab's text, hand it to a transform that came from the
   * package the extension uses, and put the answer back only if it differs.
   *
   * Comparing first is what keeps a command that changed nothing — Alt+H over a
   * table with no relations, the layout button before a diagram exists — out of
   * the undo history entirely, rather than leaving an empty step in it.
   */
  const runTextCommand = useCallback(
    (transform: (text: string) => string) => {
      const current = workspaceRef.current;
      const text = activeTab(current).text;
      const updated = transform(text);

      if (updated !== text) {
        changeWorkspace(updateActiveText(current, updated));
      }
    },
    [changeWorkspace],
  );

  const writeLayout = useCallback(() => {
    runTextCommand((text) =>
      writeLayoutIntoText(text, tableCoordsStore.getCoordEntriesForMetaInfo()),
    );
  }, [runTextCommand]);

  const toggleRefs = useCallback(
    (tableName: string) => {
      // The same call the extension makes, coordinates included: `toggleTableRefs`
      // records the table as hidden in the layout block as it comments the
      // relations out, and without a position to record it would write the table
      // back at the origin.
      const coords = tableCoordsStore.getCoords(tableName);

      runTextCommand((text) =>
        toggleTableRefs(text, tableName, {
          name: tableName,
          x: coords.x,
          y: coords.y,
        }),
      );
    },
    [runTextCommand],
  );

  const syncEffects = useCallback(
    () => <ToggleRefsShortcut onToggle={toggleRefs} />,
    [toggleRefs],
  );

  return (
    <SplitLayout
      left={
        <div className="flex h-full flex-col">
          <TabBar
            workspace={workspace}
            onActivate={(number) => {
              changeWorkspace(activateTab(workspaceRef.current, number));
            }}
            onClose={(number) => {
              changeWorkspace(closeTab(workspaceRef.current, number));
            }}
            onAdd={() => {
              changeWorkspace(addTab(workspaceRef.current, NEW_TAB_TEXT));
            }}
          />
          <DocumentBar
            onOpen={openFile}
            onDownload={() => {
              downloadTextFile(toDbmlFilename(tab.title), tab.text);
            }}
            onWriteLayout={writeLayout}
          />
          {/* `min-h-0` so the editor shrinks inside the column rather than
              pushing the bars off the top. */}
          <div className="min-h-0 flex-1">
            <EditorPane
              // Keyed on the document so switching tabs gives the editor the
              // other schema's text outright, rather than as an edit — an edit
              // would leave the undo history of one schema attached to another.
              key={documentKey}
              value={tab.text}
              onChange={(next) => {
                changeWorkspace(updateActiveText(workspaceRef.current, next));
              }}
            />
          </div>
        </div>
      }
      right={
        <DiagramApp
          schema={schema}
          schemaErrorMessage={errorMessage}
          documentKey={documentKey}
          theme={theme}
          themeColors={themeColors}
          setTheme={setTheme}
          scrollDirection={ScrollDirection.UpOut}
          syncEffects={syncEffects}
        />
      }
    />
  );
};

export default App;
