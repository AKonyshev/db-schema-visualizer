import { parseDbmlText } from "../../document/parseDbmlText";
import { DBML_LANGUAGE_ID, DBML_THEME, DBML_TOKENS } from "../dbmlLanguage";

// A snippet per keyword, each the smallest thing that uses it. The parser is the
// judge: if it accepts the snippet the keyword is real, and if the grammar has
// dropped one the loop below notices. Asserting the list against a copy of
// itself — which is what this test did first — cannot catch either.
const TOP_LEVEL_BLOCKS: Record<string, string> = {
  Table: "Table t {\n  id integer\n}\n",
  Ref: "Table a {\n  id integer\n}\nTable b {\n  a_id integer\n}\nRef: b.a_id > a.id\n",
  Enum: "Enum status {\n  active\n}\n",
  Project: "Project p {\n  database_type: 'PostgreSQL'\n}\n",
  TableGroup: "Table a {\n  id integer\n}\nTableGroup g {\n  a\n}\n",
};

// Real DBML keywords, but only inside a table — the parser rejects both at the
// top level, so they are listed apart rather than pretending to be blocks.
const IN_TABLE_KEYWORDS: Record<string, string> = {
  Note: "Table t {\n  id integer\n  Note: 'hi'\n}\n",
  indexes: "Table t {\n  id integer\n  indexes {\n    id\n  }\n}\n",
};

describe("the DBML language definition", () => {
  // The extension declares `contributes.languages[0].id === "dbml"`. If these
  // two ever disagree, the site and the editor stop meaning the same thing by
  // "DBML" and the highlighting silently does not apply.
  test("uses the identifier the extension declares", () => {
    expect(DBML_LANGUAGE_ID).toBe("dbml");
  });

  test.each(Object.entries(TOP_LEVEL_BLOCKS))(
    "%s is a block the parser accepts, and the grammar highlights it",
    (keyword, snippet) => {
      expect(parseDbmlText(snippet).errorMessage).toBeNull();
      expect(DBML_TOKENS.keywords).toContain(keyword);
    },
  );

  test.each(Object.entries(IN_TABLE_KEYWORDS))(
    "%s is accepted inside a table, and the grammar highlights it",
    (keyword, snippet) => {
      expect(parseDbmlText(snippet).errorMessage).toBeNull();
      expect(DBML_TOKENS.keywords).toContain(keyword);
    },
  );

  // The other direction: a word in the list that the parser does not know would
  // be highlighted as though it meant something.
  test("claims no keyword beyond the ones proven above", () => {
    expect([...(DBML_TOKENS.keywords as string[])].sort()).toEqual(
      [
        ...Object.keys(TOP_LEVEL_BLOCKS),
        ...Object.keys(IN_TABLE_KEYWORDS),
      ].sort(),
    );
  });

  test("has a root tokenizer rule", () => {
    expect(DBML_TOKENS.tokenizer.root.length).toBeGreaterThan(0);
  });

  // The layout metadata block is machine-written bookkeeping, so it gets its own
  // tokenizer state and its own colour.
  test("gives the layout metadata block its own tokenizer state", () => {
    expect(Object.keys(DBML_TOKENS.tokenizer)).toContain("metainfo");
  });

  // vs-dark paints `metatag` a saturated salmon and gives `attribute.value` the
  // string colour, so leaning on it would have made the layout block the
  // loudest thing on screen and settings indistinguishable from strings. These
  // assertions are what stop a later simplification from going back to it.
  test("dims the layout block rather than letting the base theme shout it", () => {
    const rule = DBML_THEME.rules.find((r) => r.token === "metainfo");
    const identifier = DBML_THEME.rules.find((r) => r.token === "identifier");

    expect(rule?.foreground).toBeDefined();
    expect(rule?.foreground).not.toBe(identifier?.foreground);
    // Dimmer than body text: every channel darker.
    const dim = parseInt(rule?.foreground ?? "ffffff", 16);
    const body = parseInt(identifier?.foreground ?? "000000", 16);
    expect(dim).toBeLessThan(body);
  });

  test("gives setting values a colour of their own, not the string colour", () => {
    const setting = DBML_THEME.rules.find((r) => r.token === "setting.value");
    const string = DBML_THEME.rules.find((r) => r.token === "string");

    expect(setting?.foreground).toBeDefined();
    expect(setting?.foreground).not.toBe(string?.foreground);
  });
});
