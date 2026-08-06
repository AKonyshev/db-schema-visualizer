import { isTypingTarget } from "../isTypingTarget";

describe("isTypingTarget", () => {
  test("returns false when the event carries no target", () => {
    expect(isTypingTarget(null)).toBe(false);
  });

  test("detects an input", () => {
    expect(isTypingTarget({ tagName: "INPUT" })).toBe(true);
  });

  // A code editor embedded in the page keeps focus in a hidden textarea, so
  // this case is what stops the diagram's shortcuts from firing mid-word.
  test("detects a textarea whatever the case of the tag name", () => {
    expect(isTypingTarget({ tagName: "textarea" })).toBe(true);
  });

  test("detects a contenteditable element", () => {
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(
      true,
    );
  });

  test("returns false for an ordinary element", () => {
    expect(isTypingTarget({ tagName: "DIV" })).toBe(false);
  });

  // Not redundant with the case above: an absent flag and an explicitly false
  // one take different paths through a looser check. This is the only case that
  // fails if the strict `=== true` is relaxed to a presence test.
  test("returns false for an element that is explicitly not editable", () => {
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: false })).toBe(
      false,
    );
  });
});
