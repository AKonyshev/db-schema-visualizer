import { diffSchemas } from "../diffSchemas";

import type { CanonSchema, CanonColumn } from "../model";

function col(p: Partial<CanonColumn> & { name: string }): CanonColumn {
  return { type: "uuid", nullable: false, pk: false, ...p };
}

function schema(
  tables: Array<{ name: string; cols: CanonColumn[]; indexes?: string[][] }>,
  enums: Array<{ name: string; values: string[] }> = [],
  refs: CanonSchema["refs"] = [],
): CanonSchema {
  return {
    tables: new Map(
      tables.map((t) => [
        t.name,
        {
          schema: "s",
          name: t.name,
          columns: new Map(t.cols.map((c) => [c.name, c])),
          indexes: (t.indexes ?? []).map((cs) => ({
            columns: cs,
            unique: false,
          })),
        },
      ]),
    ),
    enums: new Map(enums.map((e) => [e.name, e])),
    refs,
  };
}

describe("diffSchemas", () => {
  test("reports table, column, enum, ref, and index differences", () => {
    const model = schema(
      [
        { name: "a", cols: [col({ name: "id" }), col({ name: "gone" })] },
        { name: "only_dbml", cols: [col({ name: "id" })] },
      ],
      [{ name: "e", values: ["x", "y"] }],
      [
        {
          fromTable: "a",
          fromColumns: ["id"],
          toTable: "b",
          toColumns: ["a_id"],
        },
      ],
    );
    const db = schema(
      [
        {
          name: "a",
          cols: [col({ name: "id", nullable: true }), col({ name: "added" })],
          indexes: [["id"]],
        },
        { name: "only_db", cols: [col({ name: "id" })] },
      ],
      [{ name: "e", values: ["x", "z"] }],
      [],
    );

    const d = diffSchemas(model, db);
    expect(d.tablesOnlyInDbml).toEqual(["only_dbml"]);
    expect(d.tablesOnlyInDatabase).toEqual(["only_db"]);

    const aDiff = d.columnDiffs.find((c) => c.table === "a");
    expect(aDiff).toBeDefined();
    expect(aDiff?.onlyInDbml).toEqual(["gone"]);
    expect(aDiff?.onlyInDatabase).toEqual(["added"]);
    expect(aDiff?.changed).toEqual([
      {
        column: "id",
        model: col({ name: "id" }),
        database: col({ name: "id", nullable: true }),
        differs: ["nullable"],
      },
    ]);

    expect(d.enumValueDiffs).toEqual([
      { enumName: "e", onlyInDbml: ["y"], onlyInDatabase: ["z"] },
    ]);
    expect(d.refsOnlyInDbml).toEqual([
      {
        fromTable: "a",
        fromColumns: ["id"],
        toTable: "b",
        toColumns: ["a_id"],
      },
    ]);
    expect(d.refsOnlyInDatabase).toEqual([]);
    expect(d.indexDiffs).toEqual([
      {
        table: "a",
        onlyInDbml: [],
        onlyInDatabase: [{ columns: ["id"], unique: false }],
      },
    ]);
    expect(d.identical).toBe(false);
  });

  test("reports enums entirely absent in one schema", () => {
    const model = schema(
      [{ name: "a", cols: [col({ name: "id" })] }],
      [{ name: "only_model", values: ["x"] }],
    );
    const db = schema(
      [{ name: "a", cols: [col({ name: "id" })] }],
      [{ name: "only_db", values: ["y"] }],
    );
    const d = diffSchemas(model, db);
    expect(d.enumsOnlyInDbml).toEqual(["only_model"]);
    expect(d.enumsOnlyInDatabase).toEqual(["only_db"]);
    expect(d.enumValueDiffs).toEqual([]);
    expect(d.identical).toBe(false);
  });

  test("identical schemas produce identical=true and empty sections", () => {
    const s = schema([{ name: "a", cols: [col({ name: "id" })] }]);
    const s2 = schema([{ name: "a", cols: [col({ name: "id" })] }]);
    const d = diffSchemas(s, s2);
    expect(d.identical).toBe(true);
    expect(d.columnDiffs).toEqual([]);
  });
});
