import { pickTargetView } from "extension-shared/extension/views/pickTargetView";

const view = (
  documentUri: string,
  isActive = false,
): { documentUri: string; isActive: boolean } => ({
  documentUri,
  isActive,
});

describe("pickTargetView", () => {
  test("prefers the focused diagram over the active text document", () => {
    const focused = view("file:///b.dbml", true);

    expect(
      pickTargetView([view("file:///a.dbml"), focused], "file:///a.dbml"),
    ).toBe(focused);
  });

  test("falls back to the view of the active text document", () => {
    const wanted = view("file:///a.dbml");

    expect(
      pickTargetView([view("file:///b.dbml"), wanted], "file:///a.dbml"),
    ).toBe(wanted);
  });

  test("returns undefined when no view matches the active text document", () => {
    expect(
      pickTargetView([view("file:///b.dbml")], "file:///a.dbml"),
    ).toBeUndefined();
  });

  test("returns undefined when there are no views", () => {
    expect(pickTargetView([], "file:///a.dbml")).toBeUndefined();
  });

  test("returns undefined when nothing is focused and no uri is given", () => {
    expect(pickTargetView([view("file:///a.dbml")])).toBeUndefined();
  });
});
