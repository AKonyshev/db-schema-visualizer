import { composeTooltip } from "../composeTooltip";

describe("composeTooltip", () => {
  test("appends the shortcut in uppercase", () => {
    expect(composeTooltip("Auto-arrange", "l")).toBe("Auto-arrange (L)");
  });

  test("returns the label alone when there is no shortcut", () => {
    // Export and the theme toggle have no shortcut; they must not render
    // empty brackets or the string "undefined".
    expect(composeTooltip("Export")).toBe("Export");
    expect(composeTooltip("Export", undefined)).toBe("Export");
  });

  test("treats an empty or blank shortcut as no shortcut", () => {
    expect(composeTooltip("Export", "")).toBe("Export");
    expect(composeTooltip("Export", "   ")).toBe("Export");
  });

  test("leaves non-letter keys as they are", () => {
    expect(composeTooltip("Keyboard shortcuts", "?")).toBe(
      "Keyboard shortcuts (?)",
    );
  });

  test("keeps multi-character keys readable", () => {
    expect(composeTooltip("Search tables", "Ctrl/Cmd+F")).toBe(
      "Search tables (CTRL/CMD+F)",
    );
  });
});
