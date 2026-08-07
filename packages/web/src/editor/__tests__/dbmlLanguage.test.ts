import { DBML_LANGUAGE_ID, DBML_TOKENS } from "../dbmlLanguage";

describe("the DBML language definition", () => {
  // The extension declares `contributes.languages[0].id === "dbml"`. If these
  // two ever disagree, the site and the editor stop meaning the same thing by
  // "DBML" and the highlighting silently does not apply.
  test("uses the identifier the extension declares", () => {
    expect(DBML_LANGUAGE_ID).toBe("dbml");
  });

  test("carries every top-level block keyword", () => {
    expect(DBML_TOKENS.keywords).toEqual(
      expect.arrayContaining([
        "Table",
        "Ref",
        "Enum",
        "Project",
        "TableGroup",
        "Note",
        "indexes",
      ]),
    );
  });

  test("has a root tokenizer rule", () => {
    expect(DBML_TOKENS.tokenizer.root.length).toBeGreaterThan(0);
  });

  // The layout block is machine-written bookkeeping; it gets its own state so it
  // can be de-emphasised rather than syntax-coloured like authored DBML.
  test("gives the layout metadata block its own tokenizer state", () => {
    expect(Object.keys(DBML_TOKENS.tokenizer)).toContain("metainfo");
  });
});
