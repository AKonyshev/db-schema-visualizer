import { embedErrorText } from "../embedError";

describe("embedErrorText", () => {
  it("says what is wrong, and names the thing it is wrong about", () => {
    expect(embedErrorText({ kind: "srcMissing" })).toBe("No schema given");
    expect(embedErrorText({ kind: "srcInvalid", value: "/acl.dbml" })).toBe(
      "Invalid schema path: /acl.dbml",
    );
    expect(embedErrorText({ kind: "notFound", src: "acl.dbml" })).toBe(
      "Schema not found: acl.dbml",
    );
    expect(embedErrorText({ kind: "tableMissing", name: "acl.analisys" })).toBe(
      "Table not found: acl.analisys",
    );
    expect(embedErrorText({ kind: "tableAmbiguous", name: "analysis" })).toBe(
      "This name belongs to more than one table — give the full name: analysis",
    );
    expect(embedErrorText({ kind: "noTablesLeft" })).toBe(
      "None of the named tables are in this schema",
    );
  });
});
