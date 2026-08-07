import { DBML_EXTENSION, toDbmlFilename } from "../dbmlFilename";

describe("deriving a download filename from a document title", () => {
  test("appends the extension when the title lacks one", () => {
    expect(toDbmlFilename("orders")).toBe("orders.dbml");
  });

  test("keeps the extension when the title already carries it", () => {
    expect(toDbmlFilename("orders.dbml")).toBe("orders.dbml");
  });

  // Opening `Orders.DBML` and downloading it again must not produce
  // `Orders.DBML.dbml`, so the match ignores case. The extension is then
  // written back in the one casing the site uses.
  test("recognises the extension whatever its casing", () => {
    expect(toDbmlFilename("Orders.DBML")).toBe("Orders.dbml");
  });

  // A dot in the middle is part of the name, not an extension.
  test("leaves a dot inside the name alone", () => {
    expect(toDbmlFilename("orders.v2")).toBe("orders.v2.dbml");
  });

  test.each([
    ["a/b", "a-b.dbml"],
    ["a\\b", "a-b.dbml"],
    ["a:b", "a-b.dbml"],
    ['a"b', "a-b.dbml"],
    ["a<b>c", "a-b-c.dbml"],
    ["a|b", "a-b.dbml"],
    ["a?b", "a-b.dbml"],
    ["a*b", "a-b.dbml"],
    ["a\u0000b", "a-b.dbml"],
    ["a\u001Fb", "a-b.dbml"],
  ])("replaces %p, which no filesystem accepts", (title, expected) => {
    expect(toDbmlFilename(title)).toBe(expected);
  });

  // Spaces are legal on every filesystem the site can reach, so they stay.
  // Replacing them would be a house style rather than a correctness fix, and it
  // would stop a downloaded file being named what its author called it.
  test("keeps spaces inside the name", () => {
    expect(toDbmlFilename("customer orders")).toBe("customer orders.dbml");
  });

  // The characters are replaced rather than dropped: dropping them would turn
  // `a/b` and `ab` into the same name, and silently overwriting one download
  // with another is worse than an ugly filename.
  test("replaces illegal characters rather than dropping them", () => {
    expect(toDbmlFilename("a/b")).not.toBe(toDbmlFilename("ab"));
  });

  test.each(["", "   ", "\t\n"])(
    "falls back to a default for the blank title %p",
    (title) => {
      expect(toDbmlFilename(title)).toBe(`schema${DBML_EXTENSION}`);
    },
  );

  // Sanitising can empty a title that was not blank to begin with, and the
  // fallback has to catch that too — `.dbml` alone is a hidden file on every
  // Unix system, and `..dbml` is merely strange.
  test.each([".", "..", "   .  ", ".dbml"])(
    "falls back to a default when %p sanitises to nothing",
    (title) => {
      expect(toDbmlFilename(title)).toBe(`schema${DBML_EXTENSION}`);
    },
  );

  test("trims surrounding whitespace instead of putting it in the filename", () => {
    expect(toDbmlFilename("  orders  ")).toBe("orders.dbml");
  });

  test("always produces a name ending in the extension", () => {
    const titles = ["orders", "orders.dbml", "", "///", "..", "a.b.c"];

    for (const title of titles) {
      expect(toDbmlFilename(title).endsWith(DBML_EXTENSION)).toBe(true);
    }
  });

  // Not a style preference: a name that is only an extension is invisible in a
  // Unix file listing, so no input may reduce to one.
  test("never produces a name that is nothing but the extension", () => {
    const titles = ["", " ", ".", "..", "///", ".dbml", "  .DBML "];

    for (const title of titles) {
      expect(toDbmlFilename(title)).not.toBe(DBML_EXTENSION);
    }
  });
});
