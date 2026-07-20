import { type ScrollDirection } from "json-table-schema-visualizer/src/types/scrollDirection";
import { type Theme } from "json-table-schema-visualizer/src/types/theme";

export interface DefaultPageConfig {
  theme: Theme;
  scrollDirection: ScrollDirection;
  supportsDbmlFileSync?: boolean;
  /** Raw `vscode.env.language`; the webview resolves it to a supported locale. */
  locale?: string;
}
