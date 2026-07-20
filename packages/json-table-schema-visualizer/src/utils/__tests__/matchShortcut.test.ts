import { matchShortcut } from "../matchShortcut";

import { SHORTCUTS } from "@/constants/shortcuts";

const event = (
  key: string,
  overrides: Partial<Parameters<typeof matchShortcut>[0]> = {},
): Parameters<typeof matchShortcut>[0] => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  target: null,
  ...overrides,
});

describe("matchShortcut", () => {
  test("maps a letter to its action id", () => {
    expect(matchShortcut(event("c"))).toBe("colorRelations");
    expect(matchShortcut(event("a"))).toBe("animateRelations");
  });

  test("is case-insensitive", () => {
    expect(matchShortcut(event("C"))).toBe("colorRelations");
  });

  test("matches the legend on '?'", () => {
    expect(matchShortcut(event("?"))).toBe("legend");
  });

  test("ignores keys while typing in an input", () => {
    expect(
      matchShortcut(event("c", { target: { tagName: "INPUT" } })),
    ).toBeNull();
    expect(
      matchShortcut(event("c", { target: { tagName: "TEXTAREA" } })),
    ).toBeNull();
    expect(
      matchShortcut(event("c", { target: { isContentEditable: true } })),
    ).toBeNull();
  });

  test("does not hijack Ctrl+F, Cmd+F or Alt+H", () => {
    expect(matchShortcut(event("f", { ctrlKey: true }))).toBeNull();
    expect(matchShortcut(event("f", { metaKey: true }))).toBeNull();
    expect(matchShortcut(event("h", { altKey: true }))).toBeNull();
  });

  test("returns null for an unbound key", () => {
    expect(matchShortcut(event("q"))).toBeNull();
  });
});

describe("SHORTCUTS registry", () => {
  test("executable keys are unique", () => {
    const keys = SHORTCUTS.filter((s) => s.executable).map((s) =>
      s.key.toLowerCase(),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("every entry has a label", () => {
    SHORTCUTS.forEach((entry) => {
      expect(entry.label.length).toBeGreaterThan(0);
    });
  });
});
