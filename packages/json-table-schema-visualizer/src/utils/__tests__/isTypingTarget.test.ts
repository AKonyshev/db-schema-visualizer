import { isTypingTarget } from "@/utils/isTypingTarget";

describe("isTypingTarget", () => {
  it("returns false when the event carries no target", () => {
    expect(isTypingTarget(null)).toBe(false);
  });

  it("detects an input", () => {
    expect(isTypingTarget({ tagName: "INPUT" })).toBe(true);
  });

  // A code editor embedded in the page keeps focus in a hidden textarea, so
  // this case is what stops the diagram's shortcuts from firing mid-word.
  it("detects a textarea whatever the case of the tag name", () => {
    expect(isTypingTarget({ tagName: "textarea" })).toBe(true);
  });

  it("detects a contenteditable element", () => {
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(
      true,
    );
  });

  it("returns false for an ordinary element", () => {
    expect(isTypingTarget({ tagName: "DIV" })).toBe(false);
  });

  it("returns false for an element that is explicitly not editable", () => {
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: false })).toBe(
      false,
    );
  });
});
