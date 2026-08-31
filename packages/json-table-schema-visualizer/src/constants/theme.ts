import type { ThemeColors } from "@/types/theme";

import { darkPalette, lightPalette, type Palette } from "@/styles/palette";

/**
 * The canvas half of the palette.
 *
 * Konva takes hex strings, not classes, so the diagram cannot read the custom
 * properties the chrome uses. It reads the same values from the same file
 * instead — which is the point: before this, the toolbar and the tables it sat
 * over were themed by two different sets of greys that nobody had ever compared
 * side by side.
 *
 * A few colours stay outside the palette because they are not roles anything
 * else has: the shadow under a table, and the background of a note bubble that
 * has to stay legible over both a table and the canvas behind it.
 */
const themeFrom = (
  palette: Palette,
  extras: { shadow: string; noteBg: string },
): ThemeColors => ({
  text: {
    "900": palette.text,
    "700": palette.textMuted,
  },
  connection: {
    active: palette.accent,
    default: palette.borderStrong,
  },
  colAccent: palette.surfaceSunken,
  selection: {
    stroke: palette.accent,
    fill: palette.accentSoft,
  },
  table: {
    bg: palette.surfaceRaised,
    shadow: extras.shadow,
  },
  tableHeader: {
    bg: palette.surfaceSunken,
    fg: palette.text,
  },
  red: palette.danger,
  green: palette.success,
  enumItem: palette.textMuted,
  // The label drawn on a field's type chip, which is painted in the accent.
  white: palette.accentContrast,
  noteBg: extras.noteBg,
  bg: palette.surface,
});

export const defaultThemeConfig: ThemeColors = themeFrom(lightPalette, {
  shadow: "rgba(15, 23, 42, 0.18)",
  noteBg: "rgba(15, 23, 42, 0.88)",
});

export const darkThemeConfig: ThemeColors = themeFrom(darkPalette, {
  shadow: "rgba(0, 0, 0, 0.45)",
  noteBg: "rgba(23, 26, 33, 0.94)",
});
