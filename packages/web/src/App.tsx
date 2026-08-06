import { useMemo, useState } from "react";
import DiagramApp from "json-table-schema-visualizer/src/components/DiagramApp/DiagramApp";
import { useCreateTheme } from "json-table-schema-visualizer/src/hooks/theme";
import { ScrollDirection } from "json-table-schema-visualizer/src/types/scrollDirection";

import EditorPane from "./components/EditorPane";
import SplitLayout from "./components/SplitLayout";
import { parseDbmlText } from "./document/parseDbmlText";
import { useDebouncedValue } from "./hooks/useDebouncedValue";

interface AppProps {
  initialText: string;
  documentKey: string;
}

const App = ({ initialText, documentKey }: AppProps): JSX.Element => {
  const [text, setText] = useState(initialText);
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
        // documentKey is constant for the session on purpose: it keys the
        // diagram, and changing it would remount the viewer and throw away the
        // reader's table positions on every edit. The extension does the same —
        // it only switches when a different file is opened.
        <DiagramApp
          schema={schema}
          schemaErrorMessage={errorMessage}
          documentKey={documentKey}
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
