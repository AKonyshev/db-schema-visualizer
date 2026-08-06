import { parseDbmlText } from "../parseDbmlText";

describe("parseDbmlText", () => {
  test("turns valid DBML into a schema", () => {
    const result = parseDbmlText("Table users {\n  id integer [pk]\n}");

    expect(result.errorMessage).toBeNull();
    expect(result.schema?.tables).toHaveLength(1);
    expect(result.schema?.tables[0].name).toBe("users");
  });

  test("treats empty text as an empty schema", () => {
    const result = parseDbmlText("");

    expect(result.errorMessage).toBeNull();
    expect(result.schema?.tables).toHaveLength(0);
  });

  test("treats whitespace-only text as an empty schema", () => {
    const result = parseDbmlText("   \n\t  \n");

    expect(result.errorMessage).toBeNull();
    expect(result.schema?.tables).toHaveLength(0);
  });

  // Half-typed DBML is the normal state of the editor, not an exception. If this
  // threw, every pause mid-word would take the page down with it.
  test("reports malformed DBML instead of throwing", () => {
    const result = parseDbmlText("Table {{{");

    expect(result.schema).toBeNull();
    expect(result.errorMessage).not.toBeNull();
    expect(result.errorMessage).not.toBe("");
  });

  test("reports a reference to a table that does not exist", () => {
    const result = parseDbmlText(
      "Table posts {\n  author_id integer\n}\n\nRef: posts.author_id > users.id\n",
    );

    expect(result.schema).toBeNull();
    expect(result.errorMessage).not.toBeNull();
  });

  test("recovers once the text becomes valid again", () => {
    expect(parseDbmlText("Table {{{").schema).toBeNull();
    expect(
      parseDbmlText("Table users {\n  id integer\n}").schema,
    ).not.toBeNull();
  });
});
