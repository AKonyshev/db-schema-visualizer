import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceReact = path.resolve(dirname, "../../node_modules/react");
const workspaceReactDom = path.resolve(dirname, "../../node_modules/react-dom");

// Note there is no equivalent of the extension's `generateWebviewCss` hook: that
// exists only because its VS Code bundler plugin empties the output directory on
// every rebuild, wiping a separately-run stylesheet step. Nothing here does that,
// so Tailwind runs through the ordinary PostCSS pipeline.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    // Two copies of React in one Konva tree break hooks in a way that surfaces
    // as a blank canvas with nothing in the console — the same reason the
    // extension's config dedupes these.
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react-konva", "konva"],
    alias: {
      react: workspaceReact,
      "react-dom": workspaceReactDom,
      "react/jsx-runtime": path.join(workspaceReact, "jsx-runtime.js"),
      "react/jsx-dev-runtime": path.join(workspaceReact, "jsx-dev-runtime.js"),
    },
  },
});
