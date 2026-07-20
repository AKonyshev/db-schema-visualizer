import { Theme } from "json-table-schema-visualizer/src/types/theme";
import { ScrollDirection } from "json-table-schema-visualizer/src/types/scrollDirection";
import { env, workspace, type WorkspaceConfiguration } from "vscode";

import { ConfigKeys } from "../types/configKeys";
import { type DefaultPageConfig } from "../types/defaultPageConfig";

export class ExtensionConfig {
  private readonly config: WorkspaceConfiguration;

  constructor(configSession: string) {
    const extensionConfigs = workspace.getConfiguration(configSession);
    this.config = extensionConfigs;
  }

  async setTheme(theme: Theme): Promise<void> {
    try {
      await this.config.update(ConfigKeys.preferredTheme, theme);
    } catch (error) {
      console.error("Failed to set theme preference", error);
    }
  }

  getPreferredTheme(): Theme {
    const preferredTheme = this.config.get(ConfigKeys.preferredTheme);
    if (Theme.light === preferredTheme) {
      return preferredTheme;
    }

    return Theme.dark;
  }

  getScrollDirection(): ScrollDirection {
    const scrollDirection = this.config.get(ConfigKeys.scrollDirection);
    if (ScrollDirection.UpIn === scrollDirection) {
      return scrollDirection;
    }

    return ScrollDirection.UpOut;
  }

  getDefaultPageConfig(): DefaultPageConfig {
    const theme = this.getPreferredTheme();
    const scrollDirection = this.getScrollDirection();

    // The display language is the only source: package.nls is resolved by VS
    // Code before our code runs, so a per-extension language setting could only
    // ever disagree with the command palette.
    return { theme, scrollDirection, locale: env.language };
  }
}
