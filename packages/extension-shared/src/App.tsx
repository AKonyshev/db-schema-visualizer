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
  // In practice the config is always injected — `setupHtml` runs `injectScripts`
  // on both the dev-server and the packaged HTML, and `index.html` carries the
  // marker — so this fallback should never fire. It is here because the failure
  // it prevents is silent and nasty: the wheel handler in DiagramWrapper is an
  // `if`/`else if` with no `else`, so an undefined direction leaves its delta at
  // zero and the wheel zooms *out* whichever way you scroll.
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
        supportsDbmlFileSync
          ? () => (
              <DbmlFileSyncEffects rawContent={rawContent} documentKey={key} />
            )
          : undefined
      }
    />
  );
};

export default App;
