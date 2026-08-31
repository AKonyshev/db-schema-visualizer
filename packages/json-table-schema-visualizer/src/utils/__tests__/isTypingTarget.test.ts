import { isSpaceActivatedTarget, isTypingTarget } from "../isTypingTarget";

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

  // Monaco 0.56 focuses a `<div class="native-edit-context" role="textbox">`
  // via the EditContext API — no textarea, not contenteditable. Matching on the
  // tag name alone missed it, and the diagram's table search took Ctrl/Cmd+F
  // away from the editor as a result.
  test("detects an element that declares itself a textbox", () => {
    expect(isTypingTarget({ tagName: "DIV", role: "textbox" })).toBe(true);
  });

  test("detects a searchbox and a combobox the same way", () => {
    expect(isTypingTarget({ tagName: "DIV", role: "searchbox" })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", role: "combobox" })).toBe(true);
  });

  test("returns false for an ordinary element", () => {
    expect(isTypingTarget({ tagName: "DIV" })).toBe(false);
  });

  test("returns false for an element with an unrelated role", () => {
    expect(isTypingTarget({ tagName: "DIV", role: "button" })).toBe(false);
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

describe("isSpaceActivatedTarget", () => {
  it("leaves the key to a focused button", () => {
    // Space is how a button is pressed from the keyboard. The diagram claims it
    // to pan, and claiming it here would make the toolbar unusable without a
    // mouse.
    expect(isSpaceActivatedTarget({ tagName: "button" })).toBe(true);
    expect(isSpaceActivatedTarget({ tagName: "BUTTON" })).toBe(true);
  });

  it("leaves the key to a control that only says it is one", () => {
    expect(isSpaceActivatedTarget({ tagName: "DIV", role: "button" })).toBe(
      true,
    );
    expect(isSpaceActivatedTarget({ tagName: "DIV", role: "checkbox" })).toBe(
      true,
    );
  });

  it("leaves the key to anything text goes into", () => {
    expect(isSpaceActivatedTarget({ tagName: "INPUT" })).toBe(true);
    expect(isSpaceActivatedTarget({ tagName: "DIV", role: "textbox" })).toBe(
      true,
    );
    expect(
      isSpaceActivatedTarget({ tagName: "DIV", isContentEditable: true }),
    ).toBe(true);
  });

  it("hands the key over for the canvas and for nothing focused", () => {
    expect(isSpaceActivatedTarget({ tagName: "CANVAS" })).toBe(false);
    expect(isSpaceActivatedTarget({ tagName: "DIV" })).toBe(false);
    expect(isSpaceActivatedTarget(null)).toBe(false);
  });
});
