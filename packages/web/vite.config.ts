import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { workspaceReactResolve } from "../../vite.workspace-react.js";

// Note there is no equivalent of the extension's `generateWebviewCss` hook: that
// exists only because its VS Code bundler plugin empties the output directory on
// every rebuild, wiping a separately-run stylesheet step. Nothing here does that,
// so Tailwind runs through the ordinary PostCSS pipeline.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: workspaceReactResolve,
});
