import { darkThemeConfig, defaultThemeConfig } from "../theme";

import type { ThemeColors } from "@/types/theme";

import { darkPalette, lightPalette, type Palette } from "@/styles/palette";

// The note bubble is the one surface in the diagram that is not the page and
// not a table, so nothing else can vouch for the legibility of the text on it.
// It is checked here against the two things it can be drawn over — the canvas
// and a table — because a bubble is placed beside a column and lands on either.
type Rgb = [number, number, number];

const parseColor = (color: string): { rgb: Rgb; alpha: number } => {
  const rgba = /^rgba?\(([^)]+)\)$/.exec(color);
  if (rgba !== null) {
    const parts = rgba[1].split(",").map((part) => Number(part.trim()));

    return {
      rgb: [parts[0], parts[1], parts[2]],
      alpha: parts[3] ?? 1,
    };
  }

  const hex = color.replace("#", "");

  return {
    rgb: [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ],
    alpha: 1,
  };
};

const flatten = (color: string, backdrop: string): Rgb => {
  const { rgb, alpha } = parseColor(color);
  const behind = parseColor(backdrop).rgb;

  return rgb.map(
    (channel, index) => channel * alpha + behind[index] * (1 - alpha),
  ) as Rgb;
};

const relativeLuminance = (rgb: Rgb): number => {
  const [r, g, b] = rgb.map((channel) => {
    const ratio = channel / 255;

    return ratio <= 0.03928
      ? ratio / 12.92
      : Math.pow((ratio + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (foreground: Rgb, background: Rgb): number => {
  const light = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  const dark = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );

  return (light + 0.05) / (dark + 0.05);
};

// WCAG AA for body text. The note is small text, so 3:1 is not enough.
const MIN_CONTRAST = 4.5;

// Every colour the bubble draws with, not only the note itself: the enum block
// under the note is the same size type on the same surface, and it was the half
// nobody had checked.
const foregroundsOf = (theme: ThemeColors): Array<[string, string]> => [
  ["fg", theme.note.fg],
  ["muted", theme.note.muted],
  ["danger", theme.note.danger],
  ["success", theme.note.success],
];

const expectLegibleNote = (theme: ThemeColors, palette: Palette): void => {
  for (const backdrop of [palette.surface, palette.surfaceRaised]) {
    const bubble = flatten(theme.note.bg, backdrop);

    for (const [role, color] of foregroundsOf(theme)) {
      const contrast = contrastRatio(
        flatten(color, `rgb(${bubble.join(",")})`),
        bubble,
      );

      // Compared as an object so a failure names the role and the ratio it
      // reached, rather than only the number it missed.
      expect({
        role,
        contrast: Number(contrast.toFixed(2)),
        legible: contrast >= MIN_CONTRAST,
      }).toMatchObject({ role, legible: true });
    }
  }
};

describe("the note bubble", () => {
  it("keeps every colour it draws with legible in the light theme", () => {
    expectLegibleNote(defaultThemeConfig, lightPalette);
  });

  it("keeps every colour it draws with legible in the dark theme", () => {
    expectLegibleNote(darkThemeConfig, darkPalette);
  });

  // A bubble the colour of the table it covers has no edge, so the reader sees
  // one shape where there are two.
  it("stands apart from the table it is drawn over in the dark theme", () => {
    const bubble = flatten(darkThemeConfig.note.bg, darkPalette.surfaceRaised);

    expect(
      contrastRatio(bubble, parseColor(darkPalette.surfaceRaised).rgb),
    ).toBeGreaterThanOrEqual(1.2);
  });
});
