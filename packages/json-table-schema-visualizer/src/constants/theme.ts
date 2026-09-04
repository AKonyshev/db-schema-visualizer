import type { ThemeColors } from "@/types/theme";

import { darkPalette, lightPalette, type Palette } from "@/styles/palette";

/**
 * The bubble is a dark surface in *both* themes: a note in the light theme is
 * inverted on purpose, so that one bubble reads over a white canvas and a white
 * table alike. That is why a single set of foregrounds serves both themes, and
 * why none of them may come from the palette — the palette is chosen against
 * the page, and on the bubble it lands two-and-a-half to one.
 */
const noteForeground = {
  fg: "#f1f5f9",
  muted: "#cbd5e1",
  danger: "#fca5a5",
  success: "#86efac",
};

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
 * else has: the shadow under a table, and the note bubble, which is its own
 * small surface — it has to stay legible over both a table and the canvas
 * behind it, so everything drawn on it is chosen against it.
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
  note: {
    bg: extras.noteBg,
    ...noteForeground,
  },
  bg: palette.surface,
});

export const defaultThemeConfig: ThemeColors = themeFrom(lightPalette, {
  shadow: "rgba(15, 23, 42, 0.18)",
  noteBg: "rgba(15, 23, 42, 0.88)",
});

export const darkThemeConfig: ThemeColors = themeFrom(darkPalette, {
  shadow: "rgba(0, 0, 0, 0.45)",
  // Lighter than a table, not darker: in the dark theme the bubble used to be
  // `surfaceRaised` to the pixel, so it vanished into whatever table it landed
  // on. Here it reads as something lifted off the diagram.
  noteBg: "rgba(42, 48, 60, 0.96)",
});
