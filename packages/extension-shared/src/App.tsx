import DiagramApp from "json-table-schema-visualizer/src/components/DiagramApp/DiagramApp";
import { useCreateTheme } from "json-table-schema-visualizer/src/hooks/theme";
import { type Theme } from "json-table-schema-visualizer/src/types/theme";
import { ScrollDirection } from "json-table-schema-visualizer/src/types/scrollDirection";

import {
  WebviewCommand,
  type WebviewPostMessage,
} from "../extension/types/webviewCommand";

import { useSchema } from "./hooks/schema";
import DbmlFileSyncEffects from "./components/DbmlFileSyncEffects";
import { postToExtension } from "./vscodeApi";

// The VS Code adapter over the shared diagram core: it owns everything the
// core deliberately does not know about — the config the host injects onto the
// window, the schema arriving as a message, the theme preference travelling
// back, and writing layout metadata into the open file.
const App = () => {
  const { setTheme, theme, themeColors } = useCreateTheme(
    window.EXTENSION_DEFAULT_CONFIG?.theme,
  );
  const { schema, key, schemaErrorMessage, rawContent } = useSchema();
  const supportsDbmlFileSync =
    window.EXTENSION_DEFAULT_CONFIG?.supportsDbmlFileSync === true;
  // The host injects no config into the dev-server webview, so fall back to the
  // same default the core's ScrollDirectionContext uses.
  const scrollDirection =
    window.EXTENSION_DEFAULT_CONFIG?.scrollDirection ?? ScrollDirection.UpOut;

  // update the preference in the extension settings
  const saveThemePreference = (theme: Theme) => {
    setTheme(theme);
    const updateThemeMessage: WebviewPostMessage = {
      command: WebviewCommand.SET_THEME_PREFERENCES,
      message: theme,
    };

    postToExtension(updateThemeMessage);
  };

  return (
    <DiagramApp
      schema={schema}
      schemaErrorMessage={schemaErrorMessage}
      documentKey={key}
      theme={theme}
      themeColors={themeColors}
      setTheme={saveThemePreference}
      scrollDirection={scrollDirection}
      syncEffects={
        // The null check is what the core's early return used to provide: the
        // core renders a message and ignores these effects when there is no
        // schema, but the expression below still has to be safe to evaluate.
        supportsDbmlFileSync && schema !== null ? (
          <DbmlFileSyncEffects
            rawContent={rawContent}
            documentKey={key}
            singleTableName={
              schema.tables.length === 1 ? schema.tables[0].name : undefined
            }
          />
        ) : null
      }
    />
  );
};

export default App;
