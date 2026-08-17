import { matchesToggleRefsShortcut } from "../matchesToggleRefsShortcut";

const altH = {
  altKey: true,
  ctrlKey: false,
  metaKey: false,
  code: "KeyH",
  key: "h",
};

describe("matchesToggleRefsShortcut", () => {
  test("matches Alt+H by code", () => {
    expect(matchesToggleRefsShortcut(altH)).toBe(true);
  });

  test("matches Alt+H when key alone is available", () => {
    expect(matchesToggleRefsShortcut({ ...altH, code: "", key: "H" })).toBe(
      true,
    );
  });

  test("matches Alt+˙ on a Mac layout", () => {
    expect(matchesToggleRefsShortcut({ ...altH, code: "KeyH", key: "˙" })).toBe(
      true,
    );
  });

  test("rejects plain H", () => {
    expect(matchesToggleRefsShortcut({ ...altH, altKey: false })).toBe(false);
  });

  test("rejects Ctrl/Cmd chords", () => {
    expect(matchesToggleRefsShortcut({ ...altH, ctrlKey: true })).toBe(false);
    expect(matchesToggleRefsShortcut({ ...altH, metaKey: true })).toBe(false);
  });
});
