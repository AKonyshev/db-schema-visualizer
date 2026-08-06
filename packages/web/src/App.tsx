import { useMemo, useState } from "react";
import DiagramApp from "json-table-schema-visualizer/src/components/DiagramApp/DiagramApp";
import { useCreateTheme } from "json-table-schema-visualizer/src/hooks/theme";
import { ScrollDirection } from "json-table-schema-visualizer/src/types/scrollDirection";

import EditorPane from "./components/EditorPane";
import SplitLayout from "./components/SplitLayout";
import { INITIAL_DBML } from "./document/initialText";
import { parseDbmlText } from "./document/parseDbmlText";
import { useDebouncedValue } from "./hooks/useDebouncedValue";

// Keyed for the whole session on purpose: `documentKey` identifies the diagram's
// stored table layout, and changing it would remount the viewer and throw away
// the reader's arrangement on every edit. The extension switches only when a
// different file is opened.
export const DOCUMENT_KEY = "web";

const App = (): JSX.Element => {
  const [text, setText] = useState(INITIAL_DBML);
  const debouncedText = useDebouncedValue(text);
  const { schema, errorMessage } = useMemo(
    () => parseDbmlText(debouncedText),
    [debouncedText],
  );
  const { theme, themeColors, setTheme } = useCreateTheme();

  return (
    <SplitLayout
      left={<EditorPane value={text} onChange={setText} />}
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
