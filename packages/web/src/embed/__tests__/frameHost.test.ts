import { expandMessage, helloMessage, parseHostMessage } from "../frameHost";

describe("the frame's half of the protocol", () => {
  it("announces itself", () => {
    expect(helloMessage()).toEqual({ source: "dbml-frame", type: "hello" });
  });

  it("asks to be expanded and to be put back", () => {
    expect(expandMessage(true)).toEqual({
      source: "dbml-frame",
      type: "expand",
      expanded: true,
    });
    expect(expandMessage(false)).toEqual({
      source: "dbml-frame",
      type: "expand",
      expanded: false,
    });
  });
});

describe("parseHostMessage", () => {
  it("reads the answer to hello", () => {
    expect(parseHostMessage({ source: "dbml-frame", type: "ready" })).toEqual({
      source: "dbml-frame",
      type: "ready",
    });
  });

  it("reads the state the host settled on", () => {
    expect(
      parseHostMessage({
        source: "dbml-frame",
        type: "expanded",
        expanded: true,
      }),
    ).toEqual({ source: "dbml-frame", type: "expanded", expanded: true });

    expect(
      parseHostMessage({
        source: "dbml-frame",
        type: "expanded",
        expanded: false,
      }),
    ).toEqual({ source: "dbml-frame", type: "expanded", expanded: false });
  });

  it("refuses the frame's own messages", () => {
    // Not a hypothetical: a frame opened straight from the address bar has
    // `window.parent === window`, so its own hello arrives back at it. Taking
    // that for an answer would show an expand button on a page with no host to
    // expand anything.
    expect(parseHostMessage(helloMessage())).toBeNull();
    expect(parseHostMessage(expandMessage(true))).toBeNull();
  });

  it("refuses traffic that is not ours", () => {
    expect(parseHostMessage({ type: "ready" })).toBeNull();
    expect(parseHostMessage({ source: "webpack", type: "ready" })).toBeNull();
    expect(
      parseHostMessage({ source: "dbml-frame", type: "nonsense" }),
    ).toBeNull();
  });

  it("refuses a state that is not a state", () => {
    expect(
      parseHostMessage({ source: "dbml-frame", type: "expanded" }),
    ).toBeNull();
    expect(
      parseHostMessage({
        source: "dbml-frame",
        type: "expanded",
        expanded: "yes",
      }),
    ).toBeNull();
  });

  it("refuses what is not an object at all", () => {
    for (const value of [null, undefined, "ready", 7, []]) {
      expect(parseHostMessage(value)).toBeNull();
    }
  });
});
