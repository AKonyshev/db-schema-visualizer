import { readFileSync } from "node:fs";
import { join } from "node:path";

import { darkPalette, lightPalette, type Palette } from "../palette";

// The stylesheet says every colour a second time, because CSS cannot import
// from TypeScript. This is what keeps the second copy honest: rename or restyle
// on one side and the other fails here rather than six months later, on one
// half of one theme, in a screenshot nobody took.
const STYLESHEET = readFileSync(join(__dirname, "..", "index.css"), "utf8");

const blockFor = (selector: string): string => {
  const start = STYLESHEET.indexOf(`${selector} {`);
  expect(start).toBeGreaterThan(-1);

  return STYLESHEET.slice(start, STYLESHEET.indexOf("}", start));
};

// `surfaceRaised` in TypeScript is `--surface-raised` in CSS.
const customPropertyFor = (key: string): string =>
  `--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;

const expectPaletteIn = (selector: string, palette: Palette): void => {
  const block = blockFor(selector);

  for (const [key, value] of Object.entries(palette)) {
    expect(block).toContain(`${customPropertyFor(key)}: ${value};`);
  }
};

describe("the palette and the stylesheet", () => {
  it("agree on the light theme", () => {
    expectPaletteIn(":root", lightPalette);
  });

  it("agree on the dark theme", () => {
    expectPaletteIn(".dark", darkPalette);
  });

  it("name the same colours on both sides", () => {
    expect(Object.keys(darkPalette)).toEqual(Object.keys(lightPalette));
  });
});
