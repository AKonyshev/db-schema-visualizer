import { Theme } from "json-table-schema-visualizer/src/types/theme";

import { preferredTheme } from "../preferredTheme";

describe("preferredTheme", () => {
  test("a stored choice wins over the system", () => {
    expect(preferredTheme(Theme.light, true)).toBe(Theme.light);
    expect(preferredTheme(Theme.dark, false)).toBe(Theme.dark);
  });

  test("with nothing stored, the system decides", () => {
    expect(preferredTheme(null, true)).toBe(Theme.dark);
    expect(preferredTheme(null, false)).toBe(Theme.light);
  });

  test("a value this build cannot read is not a choice", () => {
    // Written by another version, or by something else entirely. Falling back to
    // the system is better than falling back to a guess.
    expect(preferredTheme("solarized", false)).toBe(Theme.light);
    expect(preferredTheme("", true)).toBe(Theme.dark);
  });
});
