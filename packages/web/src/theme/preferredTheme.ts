import { Theme } from "json-table-schema-visualizer/src/types/theme";

export const THEME_KEY = "web:theme";

/**
 * Which theme to open in.
 *
 * A choice the reader made outranks the system, and the system outranks our
 * preference — which is what the site did wrong before: it opened dark on a
 * machine set to light, every time, and forgot the correction on reload.
 *
 * Pure, and given both facts rather than reading them, so the awkward cases —
 * a value written by an older version, storage that cannot be read at all — are
 * decided here and tested as arithmetic.
 */
export const preferredTheme = (
  stored: string | null,
  prefersDark: boolean,
): Theme => {
  if (stored === Theme.dark || stored === Theme.light) {
    return stored;
  }

  return prefersDark ? Theme.dark : Theme.light;
};

/** What the browser says, or dark when it will not say. */
export const systemPrefersDark = (): boolean => {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return true;
  }
};

export const readStoredTheme = (): string | null => {
  try {
    return window.localStorage.getItem(THEME_KEY);
  } catch {
    // Safari's private mode and a browser told to block site data both raise on
    // access. A reader whose choice cannot be remembered still gets a page.
    return null;
  }
};

export const writeStoredTheme = (theme: Theme): void => {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Nothing useful to do, and nothing worth interrupting the reader over.
  }
};
