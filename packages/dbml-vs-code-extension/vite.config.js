import path from "node:path";
import { fileURLToPath } from "node:url";

import vscode from "@tomjs/vite-plugin-vscode";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceReact = path.resolve(__dirname, "../../node_modules/react");
const workspaceReactDom = path.resolve(
  __dirname,
  "../../node_modules/react-dom",
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react(), vscode()],
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react-konva", "konva"],
    alias: {
      react: workspaceReact,
      "react-dom": workspaceReactDom,
      "react/jsx-runtime": path.join(workspaceReact, "jsx-runtime.js"),
      "react/jsx-dev-runtime": path.join(workspaceReact, "jsx-dev-runtime.js"),
    },
  },
});
