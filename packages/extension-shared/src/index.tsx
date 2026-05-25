import { createRoot } from "react-dom/client";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";

import App from "./App";
import WebviewErrorBoundary from "./components/WebviewErrorBoundary";
import { initVsCodeWebviewApi } from "./vscodeApi";

export const createExtensionApp = () => {
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
