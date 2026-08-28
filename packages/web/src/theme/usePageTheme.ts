import { useLayoutEffect } from "react";
import {
  useCreateTheme,
  useThemeClass,
} from "json-table-schema-visualizer/src/hooks/theme";
import { type ThemeProviderValue } from "json-table-schema-visualizer/src/types/theme";

import {
  preferredTheme,
  readStoredTheme,
  systemPrefersDark,
  writeStoredTheme,
} from "./preferredTheme";

/**
 * The viewer's theme state, made the page's.
 *
 * `useCreateTheme` holds the value and hands it to the diagram; everything else
 * — the class on the document, remembering the choice, honouring the system on
 * a first visit — is the host's business, and this is where a host does it.
 *
 * The class on the document is the shared package's business — both hosts need
 * it and both were getting it wrong — so it comes from `useThemeClass`.
 */
export const usePageTheme = (): ThemeProviderValue => {
  const theme = useCreateTheme(
    preferredTheme(readStoredTheme(), systemPrefersDark()),
  );

  useThemeClass(theme.theme);

  useLayoutEffect(() => {
    writeStoredTheme(theme.theme);
  }, [theme.theme]);

  return theme;
};
