import * as fs from "fs";
import * as path from "path";

const packageRoot = path.join(__dirname, "..", "..");

const readJson = <T>(...segments: string[]): T =>
  JSON.parse(fs.readFileSync(path.join(packageRoot, ...segments), "utf8")) as T;

interface Manifest {
  contributes: {
    languages: Array<{ id: string; configuration?: string }>;
    grammars?: Array<{ language: string; scopeName: string; path: string }>;
  };
}

interface Grammar {
  scopeName: string;
  patterns: Array<{ include?: string }>;
  repository: Record<string, unknown>;
}

const manifest = (): Manifest => readJson<Manifest>("package.json");

describe("dbml syntax highlighting", () => {
  test("the language points at a grammar that is really there", () => {
    const grammars = manifest().contributes.grammars ?? [];

    expect(grammars).toHaveLength(1);
    expect(grammars[0].language).toBe("dbml");
    expect(fs.existsSync(path.join(packageRoot, grammars[0].path))).toBe(true);
  });

  test("the scope the manifest names is the scope the grammar declares", () => {
    const grammars = manifest().contributes.grammars ?? [];
    const grammar = readJson<Grammar>(grammars[0].path);

    // A mismatch here does not fail anywhere — the file simply stays unhighlighted.
    expect(grammar.scopeName).toBe(grammars[0].scopeName);
  });

  test("the language configuration is really there", () => {
    const language = manifest().contributes.languages.find(
      (item) => item.id === "dbml",
    );

    expect(language?.configuration).toBeDefined();
    expect(
      fs.existsSync(path.join(packageRoot, language?.configuration ?? "")),
    ).toBe(true);
  });

  test("every pattern the grammar includes is one it defines", () => {
    const grammars = manifest().contributes.grammars ?? [];
    const grammar = readJson<Grammar>(grammars[0].path);

    const included =
      JSON.stringify(grammar)
        .match(/"#[a-zA-Z]+"/g)
        ?.map((match) => match.slice(2, -1)) ?? [];

    included.forEach((name) => {
      expect(Object.keys(grammar.repository)).toContain(name);
    });
  });

  // The site highlights DBML through Monaco with its own token rules. Two
  // grammars for one language drift silently — each still works, and the same
  // file quietly reads differently depending on where it is opened.
  test("highlights the same keywords the site does", () => {
    const grammars = manifest().contributes.grammars ?? [];
    const grammar = readJson<Grammar>(grammars[0].path);
    const keywordRule = JSON.stringify(grammar.repository.keywords);

    const monaco = fs.readFileSync(
      path.join(packageRoot, "..", "web", "src", "editor", "dbmlLanguage.ts"),
      "utf8",
    );
    const keywordBlock = /keywords:\s*\[([^\]]*)\]/.exec(monaco)?.[1] ?? "";
    const siteKeywords = [...keywordBlock.matchAll(/"([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(siteKeywords.length).toBeGreaterThan(0);
    siteKeywords.forEach((keyword) => {
      expect(keywordRule).toContain(keyword);
    });
  });

  test("the layout block is matched before the block comment that would swallow it", () => {
    const grammars = manifest().contributes.grammars ?? [];
    const grammar = readJson<Grammar>(grammars[0].path);
    const order = grammar.patterns.map((pattern) => pattern.include);

    expect(order.indexOf("#metainfo")).toBeLessThan(order.indexOf("#comments"));
  });
});
