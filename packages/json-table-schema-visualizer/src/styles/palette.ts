/**
 * The one place a colour is decided.
 *
 * Two halves of this product cannot share a stylesheet: the chrome is DOM and
 * uses Tailwind, the diagram is a canvas and takes hex strings in JavaScript.
 * Before this file they drifted apart — a toolbar in one grey, tables in
 * another, and a "theme" that only the canvas obeyed.
 *
 * So the values live here, in TypeScript, and reach the two halves by two
 * routes: `constants/theme.ts` hands them to Konva, and `styles/index.css`
 * declares them as custom properties that both Tailwind configs map to
 * utilities (`bg-surface`, `text-muted`, `border-subtle`, `bg-accent`).
 *
 * THE HEX VALUES IN `index.css` MUST MATCH THESE. CSS cannot import from
 * TypeScript, and generating the file at build time would put a code generator
 * between a designer and a colour. Two lists, one comment, and a test that
 * fails when they disagree — see `styles/__tests__/palette.test.ts`.
 */
export interface Palette {
  /** The page itself. */
  surface: string;
  /** Panels standing on the page: the tree, the toolbar, a menu. */
  surfaceRaised: string;
  /** Wells cut into it: the editor, an input. */
  surfaceSunken: string;
  /** Hairlines between regions. */
  border: string;
  /** A border that has to be seen on its own — a focused input, a divider. */
  borderStrong: string;
  text: string;
  textMuted: string;
  /** Selection, focus, the marks that say "this one". */
  accent: string;
  /** What is legible on top of the accent. */
  accentContrast: string;
  /** A relation under the pointer, and anything else that is live. */
  accentSoft: string;
  danger: string;
  warning: string;
  success: string;
}

export const lightPalette: Palette = {
  surface: "#ffffff",
  surfaceRaised: "#f8fafc",
  surfaceSunken: "#f1f5f9",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  textMuted: "#64748b",
  accent: "#2563eb",
  accentContrast: "#ffffff",
  accentSoft: "#93c5fd",
  danger: "#dc2626",
  warning: "#d97706",
  success: "#16a34a",
};

export const darkPalette: Palette = {
  // Not black. A canvas of thin lines on pure black is harsher than the same
  // lines on a surface with a little blue in it, and the diagram is nothing but
  // thin lines.
  surface: "#0f1115",
  surfaceRaised: "#171a21",
  surfaceSunken: "#0b0d11",
  border: "#262b36",
  borderStrong: "#3a4150",
  text: "#e6e9ef",
  textMuted: "#98a2b3",
  accent: "#4f8cff",
  accentContrast: "#0b0d11",
  accentSoft: "#1d4ed8",
  danger: "#f87171",
  warning: "#fbbf24",
  success: "#4ade80",
};
