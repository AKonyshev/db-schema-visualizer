import { parseDbmlText } from "../../document/parseDbmlText";
import {
  DBML_DARK_THEME,
  DBML_LANGUAGE_ID,
  DBML_LIGHT_THEME,
  DBML_TOKENS,
} from "../dbmlLanguage";

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
  // assertions are what stop a later simplification from going back to it —
  // and they run over both themes, because a second theme is exactly where a
  // guarantee like this gets forgotten.
  const THEMES = {
    dark: DBML_DARK_THEME,
    light: DBML_LIGHT_THEME,
  };

  const channels = (hex: string): number[] => [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];

  // How far a colour stands out from the page it is written on. Distance rather
  // than "darker": on a light theme dimmer means lighter, and a test that said
  // "smaller number" would pass on one theme and be nonsense on the other.
  const contrastWithBackground = (
    theme: (typeof THEMES)[keyof typeof THEMES],
    token: string,
  ): number => {
    const rule = theme.rules.find((candidate) => candidate.token === token);
    const foreground = rule?.foreground;
    expect(foreground).toBeDefined();

    const background = theme.colors["editor.background"].replace("#", "");

    return channels(foreground ?? "")
      .map((value, index) => Math.abs(value - channels(background)[index]))
      .reduce((total, value) => total + value, 0);
  };

  const foregroundOf = (
    theme: (typeof THEMES)[keyof typeof THEMES],
    token: string,
  ): string | undefined =>
    theme.rules.find((candidate) => candidate.token === token)?.foreground;

  describe.each(Object.entries(THEMES))("the %s theme", (_name, theme) => {
    test("dims the layout block rather than letting the base theme shout it", () => {
      expect(contrastWithBackground(theme, "metainfo")).toBeLessThan(
        contrastWithBackground(theme, "identifier"),
      );
    });

    test("gives setting values a colour of their own, not the string colour", () => {
      expect(foregroundOf(theme, "setting.value")).toBeDefined();
      expect(foregroundOf(theme, "setting.value")).not.toBe(
        foregroundOf(theme, "string"),
      );
    });

    test("paints the editor in the page's own surface, not Monaco's default", () => {
      // The editor sits inside the page rather than in a window of its own, so
      // a background it brought with it would be a hole in the layout.
      expect(theme.colors["editor.background"]).toBeDefined();
    });
  });
});
