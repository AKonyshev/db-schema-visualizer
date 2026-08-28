import { type ReactNode } from "react";
import { type JSONTableSchema } from "shared/types/tableSchema";

import DiagramViewer from "../DiagramViewer/DiagramViewer";
import ErrorMessage from "../Messages/ErrorMessage";
import NoSchemaMessage from "../Messages/NoSchemaMessage";

import ScrollDirectionProvider from "@/providers/ScrollDirectionProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import { type ScrollDirection } from "@/types/scrollDirection";
import { type Theme, type ThemeColors } from "@/types/theme";

interface DiagramAppProps {
  schema: JSONTableSchema | null;
  schemaErrorMessage: string | null;
  /** Identifies the document: switching it remounts the viewer and selects that
   * document's stored table layout. */
  documentKey: string | null;
  theme: Theme;
  themeColors: ThemeColors;
  setTheme: (value: Theme) => void;
  scrollDirection: ScrollDirection;
  /** Host-specific effects rendered inside the viewer — the extension uses this
   * to write table positions back into the open file. Called only once a schema
   * exists, so the host never has to re-check for one. */
  syncEffects?: (schema: JSONTableSchema) => ReactNode;
  /** Host-specific buttons added to the toolbar — the site uses this for the
   * two actions that only mean something in a browser: downloading the schema
   * as a file, and writing the layout into text it holds rather than a file on
   * disk. The extension passes nothing, because it has neither problem. */
  hostActions?: ReactNode;
}

// The composition both hosts share. It reads nothing from `window` and knows
// nothing about where its schema came from: the VS Code adapter feeds it
// messages from the extension host, a browser adapter feeds it editor text.
// Anything host-specific belongs in the adapter above it, not behind a flag in
// here.
const DiagramApp = ({
  schema,
  schemaErrorMessage,
  documentKey,
  theme,
  themeColors,
  setTheme,
  scrollDirection,
  syncEffects,
  hostActions,
}: DiagramAppProps) => {
  if (schemaErrorMessage !== null && schema === null) {
    return <ErrorMessage message={schemaErrorMessage} />;
  }

  if (schema === null) {
    return <NoSchemaMessage />;
  }

  return (
    <ThemeProvider theme={theme} setTheme={setTheme} themeColors={themeColors}>
      <ScrollDirectionProvider scrollDirection={scrollDirection}>
        <DiagramViewer
          key={documentKey}
          documentKey={documentKey}
          {...schema}
          syncEffects={syncEffects?.(schema) ?? null}
          hostActions={hostActions}
        />
      </ScrollDirectionProvider>
    </ThemeProvider>
  );
};

export default DiagramApp;
