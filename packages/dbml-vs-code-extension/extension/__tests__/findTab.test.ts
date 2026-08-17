import { findTab } from "extension-shared/extension/views/findTab";

const uri = (value: string): { toString: () => string } => ({
  toString: () => value,
});

const textTab = (value: string): { input: unknown } => ({
  input: { uri: uri(value) },
});

const customTab = (value: string, viewType: string): { input: unknown } => ({
  input: { uri: uri(value), viewType },
});

describe("findTab", () => {
  test("finds the custom editor tab for a document", () => {
    const wanted = customTab("file:///a.dbml", "dblm-preview-webview");

    expect(
      findTab(
        [textTab("file:///a.dbml"), wanted],
        "file:///a.dbml",
        "dblm-preview-webview",
      ),
    ).toBe(wanted);
  });

  test("finds the text tab when no viewType is given", () => {
    const wanted = textTab("file:///a.dbml");

    expect(
      findTab(
        [customTab("file:///a.dbml", "dblm-preview-webview"), wanted],
        "file:///a.dbml",
      ),
    ).toBe(wanted);
  });

  test("does not confuse another document's tab", () => {
    expect(
      findTab([textTab("file:///b.dbml")], "file:///a.dbml"),
    ).toBeUndefined();
  });

  test("ignores a custom editor of a different viewType", () => {
    expect(
      findTab([customTab("file:///a.dbml", "other.editor")], "file:///a.dbml"),
    ).toBeUndefined();
  });

  test("skips tabs whose input carries no uri", () => {
    const diffTab = {
      input: {
        original: uri("file:///a.dbml"),
        modified: uri("file:///b.dbml"),
      },
    };
    const terminalTab = { input: {} };

    expect(findTab([diffTab, terminalTab], "file:///a.dbml")).toBeUndefined();
  });

  test("tolerates a tab with no input at all", () => {
    expect(findTab([{ input: undefined }], "file:///a.dbml")).toBeUndefined();
  });
});
