import { useCallback, useMemo, useState } from "react";
import DiagramApp from "json-table-schema-visualizer/src/components/DiagramApp/DiagramApp";
import { useCreateTheme } from "json-table-schema-visualizer/src/hooks/theme";
import { ScrollDirection } from "json-table-schema-visualizer/src/types/scrollDirection";

import DocumentBar from "./components/DocumentBar";
import EditorPane from "./components/EditorPane";
import SplitLayout from "./components/SplitLayout";
import { toDbmlFilename } from "./document/dbmlFilename";
import { downloadTextFile } from "./document/downloadTextFile";
import { INITIAL_DBML } from "./document/initialText";
import { parseDbmlText } from "./document/parseDbmlText";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useFileDrop } from "./hooks/useFileDrop";

// Keyed for the whole session on purpose: `documentKey` identifies the diagram's
// stored table layout, and changing it would remount the viewer and throw away
// the reader's arrangement on every edit. The extension switches only when a
// different file is opened.
export const DOCUMENT_KEY = "web";

const App = (): JSX.Element => {
  const [text, setText] = useState(INITIAL_DBML);
  // Empty until a file arrives. The filename rules live in one pure function, so
  // there is no second default to keep in step with it — a blank title is what
  // asks that function for its fallback.
  const [title, setTitle] = useState("");

  const debouncedText = useDebouncedValue(text);
  const { schema, errorMessage } = useMemo(
    () => parseDbmlText(debouncedText),
    [debouncedText],
  );
  const { theme, themeColors, setTheme } = useCreateTheme();

  const openFile = useCallback((file: File) => {
    // Decoded as UTF-8 and never sent anywhere: the read happens in the page,
    // which is what lets someone paste a production schema in without it
    // becoming a request.
    //
    // One byte does not survive the trip: `File.text()` strips a leading UTF-8
    // BOM, so a file written by a Windows editor comes back three bytes shorter.
    // Keeping it would mean carrying it as state the reader cannot see, and
    // keeping it *in the text* is worse — the parser rejects U+FEFF, so the
    // diagram would go blank for exactly those files.
    void file.text().then((contents) => {
      setText(contents);
      setTitle(file.name);
    });
  }, []);

  useFileDrop(openFile);

  return (
    <SplitLayout
      left={
        <div className="flex h-full flex-col">
          <DocumentBar
            onOpen={openFile}
            onDownload={() => {
              downloadTextFile(toDbmlFilename(title), text);
            }}
          />
          {/* `min-h-0` so the editor shrinks inside the column rather than
              pushing the bar off the top. */}
          <div className="min-h-0 flex-1">
            <EditorPane value={text} onChange={setText} />
          </div>
        </div>
      }
      right={
        <DiagramApp
          schema={schema}
          schemaErrorMessage={errorMessage}
          documentKey={DOCUMENT_KEY}
          theme={theme}
          themeColors={themeColors}
          setTheme={setTheme}
          scrollDirection={ScrollDirection.UpOut}
        />
      }
    />
  );
};

export default App;
