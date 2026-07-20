import DiagramViewer from "json-table-schema-visualizer/src/components/DiagramViewer/DiagramViewer";
import { useCreateTheme } from "json-table-schema-visualizer/src/hooks/theme";
import ThemeProvider from "json-table-schema-visualizer/src/providers/ThemeProvider";
import NoSchemaMessage from "json-table-schema-visualizer/src/components/Messages/NoSchemaMessage";
import ErrorMessage from "json-table-schema-visualizer/src/components/Messages/ErrorMessage";
import { type Theme } from "json-table-schema-visualizer/src/types/theme";
import ScrollDirectionProvider from "json-table-schema-visualizer/src/providers/ScrollDirectionProvider";
import { MESSAGES_RU } from "json-table-schema-visualizer/src/i18n/locales/ru";
import { MESSAGES_ZH_CN } from "json-table-schema-visualizer/src/i18n/locales/zh-cn";
import { resolveLocale } from "json-table-schema-visualizer/src/i18n/resolveLocale";
import {
  registerCatalog,
  setLocale,
} from "json-table-schema-visualizer/src/i18n/t";

import {
  WebviewCommand,
  type WebviewPostMessage,
} from "../extension/types/webviewCommand";

import { useSchema } from "./hooks/schema";
import DbmlFileSyncEffects from "./components/DbmlFileSyncEffects";
import { postToExtension } from "./vscodeApi";

// Resolved once at module load: the locale cannot change without a window
// reload, which recreates the webview.
registerCatalog("ru", MESSAGES_RU);
registerCatalog("zh-cn", MESSAGES_ZH_CN);
setLocale(resolveLocale(window.EXTENSION_DEFAULT_CONFIG?.locale));

const App = () => {
  const { setTheme, theme, themeColors } = useCreateTheme(
    window.EXTENSION_DEFAULT_CONFIG?.theme,
  );
  const { schema, key, schemaErrorMessage, rawContent } = useSchema();
  const supportsDbmlFileSync =
    window.EXTENSION_DEFAULT_CONFIG?.supportsDbmlFileSync === true;

  if (schemaErrorMessage !== null && schema === null) {
    return <ErrorMessage message={schemaErrorMessage} />;
  }

  if (schema === null) {
    return <NoSchemaMessage />;
  }

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
    <ThemeProvider
      theme={theme}
      setTheme={saveThemePreference}
      themeColors={themeColors}
    >
      <ScrollDirectionProvider
        scrollDirection={window.EXTENSION_DEFAULT_CONFIG?.scrollDirection}
      >
        <DiagramViewer
          key={key}
          documentKey={key}
          {...schema}
          syncEffects={
            supportsDbmlFileSync ? (
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
      </ScrollDirectionProvider>
    </ThemeProvider>
  );
};

export default App;
