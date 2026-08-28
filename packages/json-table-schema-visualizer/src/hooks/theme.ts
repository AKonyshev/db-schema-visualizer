import { useContext, useLayoutEffect, useState } from "react";

import {
  Theme,
  type ThemeColors,
  type ThemeProviderValue,
} from "@/types/theme";
import { ThemeContext } from "@/providers/ThemeProvider";
import { darkThemeConfig, defaultThemeConfig } from "@/constants/theme";

export const useThemeContext = (): ThemeProviderValue => {
  const contextValue = useContext(ThemeContext);
  if (contextValue === undefined) {
    throw new Error("it seem you forgot to wrap your app with ThemeProvider");
  }

  return contextValue;
};

export const useThemeColors = (): ThemeColors => {
  const contextValue = useThemeContext();

  return contextValue.themeColors;
};

export const useCreateTheme = (
  defaultTheme: Theme = Theme.dark,
): ThemeProviderValue => {
  const [theme, setTheme] = useState(defaultTheme);

  const themeColors =
    theme === Theme.dark ? darkThemeConfig : defaultThemeConfig;

  return { setTheme, theme, themeColors };
};

/**
 * The class every themed rule hangs off, on the document root.
 *
 * On the root rather than on some element inside the page, because the palette
 * is declared as custom properties on `:root` and `.dark`: an element that is
 * not inside the class sees the light values, and `body` is never inside it.
 * That is the whole bug this replaced — a toolbar that turned over with the
 * theme while the page behind it stayed white.
 */
export const applyThemeClass = (theme: Theme): void => {
  document.documentElement.classList.toggle("dark", theme === Theme.dark);
};

/**
 * Keeps that class in step with the theme, for a host that renders into a page
 * of its own. `useLayoutEffect`, because the class decides what colour the page
 * is and the browser must not paint the previous one first.
 */
export const useThemeClass = (theme: Theme): void => {
  useLayoutEffect(() => {
    applyThemeClass(theme);
  }, [theme]);
};
