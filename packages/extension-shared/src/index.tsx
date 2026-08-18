import { createRoot } from "react-dom/client";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";
import { initI18n } from "json-table-schema-visualizer/src/i18n/initI18n";

import App from "./App";
import WebviewErrorBoundary from "./components/WebviewErrorBoundary";
import { initVsCodeWebviewApi } from "./vscodeApi";

export const createExtensionApp = () => {
  // Before anything renders. The locale cannot change without a window reload,
  // which recreates the webview, so once is enough.
  initI18n(window.EXTENSION_DEFAULT_CONFIG?.locale);
  initVsCodeWebviewApi();
  // save current table position when exiting the page
  window.addEventListener("unload", () => {
    tableCoordsStore.saveCurrentStore();
  });

  const View = () => {
    return (
      <WebviewErrorBoundary>
        <App />
      </WebviewErrorBoundary>
    );
  };

  const appWrapper = document.getElementById("app");

  if (appWrapper !== null) {
    const root = createRoot(appWrapper);
    root.render(<View />);
  }
};
