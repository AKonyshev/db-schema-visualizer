import { type JSONTableSchema } from "shared/types/tableSchema";

import { filterSchema } from "../filterSchema";

const table = (name: string): JSONTableSchema["tables"][number] => ({
  name,
  fields: [],
  indexes: [],
  x: 0,
  y: 0,
});

/** A table the file holds a place for, as one parsed from a layout block is. */
const arranged = (
  name: string,
  x: number,
  y: number,
): JSONTableSchema["tables"][number] => ({
  ...table(name),
  x,
  y,
  fromMetaInfo: true,
  metaInfoPositions: { FullDetails: { x, y } },
});

const ref = (from: string, to: string): JSONTableSchema["refs"][number] => ({
  name: `${from}_${to}`,
  endpoints: [
    { relation: "1", tableName: from, fieldNames: ["id"] },
    { relation: "*", tableName: to, fieldNames: ["parent_id"] },
  ],
});

const schema: JSONTableSchema = {
  tables: [
    table("acl.analysis"),
    table("acl.analysis_liquid"),
    table("acl.gas_dynamic_research"),
  ],
  refs: [
    ref("acl.analysis", "acl.analysis_liquid"),
    ref("acl.analysis", "acl.gas_dynamic_research"),
  ],
  enums: [{ name: "acl.state", values: [{ name: "open" }] }],
};

describe("filterSchema", () => {
  it("keeps the whole schema when nothing was named", () => {
    expect(filterSchema(schema, null)).toEqual({ ok: true, schema });
  });

  it("keeps the named tables and the relations wholly inside them", () => {
    expect(
      filterSchema(schema, ["acl.analysis", "acl.analysis_liquid"]),
    ).toEqual({
      ok: true,
      schema: {
        tables: [table("acl.analysis"), table("acl.analysis_liquid")],
        // The relation to gas_dynamic_research is gone: one of its ends is not
        // on the diagram, and an edge into nothing is worse than no edge.
        refs: [ref("acl.analysis", "acl.analysis_liquid")],
        enums: schema.enums,
      },
    });
  });

  // Every table in acl.dbml sits in the `acl` schema; making the author write
  // the prefix eighteen times is the reason this exists.
  it("accepts a short name when it is unambiguous", () => {
    expect(filterSchema(schema, ["analysis", "analysis_liquid"])).toEqual({
      ok: true,
      schema: {
        tables: [table("acl.analysis"), table("acl.analysis_liquid")],
        refs: [ref("acl.analysis", "acl.analysis_liquid")],
        enums: schema.enums,
      },
    });
  });

  it("refuses a short name that names two tables", () => {
    const ambiguous: JSONTableSchema = {
      tables: [table("acl.analysis"), table("mer.analysis")],
      refs: [],
      enums: [],
    };

    expect(filterSchema(ambiguous, ["analysis"])).toEqual({
      ok: false,
      error: { kind: "tableAmbiguous", name: "analysis" },
    });
  });

  // A full name wins outright: `acl.analysis` is not ambiguous just because
  // `mer.analysis` also exists.
  it("prefers an exact full name over the short-name lookup", () => {
    const ambiguous: JSONTableSchema = {
      tables: [table("acl.analysis"), table("mer.analysis")],
      refs: [],
      enums: [],
    };

    expect(filterSchema(ambiguous, ["acl.analysis"])).toEqual({
      ok: true,
      schema: { tables: [table("acl.analysis")], refs: [], enums: [] },
    });
  });

  it("refuses a name that is in no table", () => {
    expect(filterSchema(schema, ["acl.analisys"])).toEqual({
      ok: false,
      error: { kind: "tableMissing", name: "acl.analisys" },
    });
  });

  it("refuses when the filter would leave nothing", () => {
    const empty: JSONTableSchema = { tables: [], refs: [], enums: [] };

    expect(filterSchema(empty, null)).toEqual({
      ok: false,
      error: { kind: "noTablesLeft" },
    });
  });

  it("drops the file's own layout when it has left tables out", () => {
    // A layout block describes where the tables sat among all the others. Keep
    // it for a subset and the three that survive stay at the coordinates they
    // held in a diagram of thirty, which is a frame of white with something
    // small in two of its corners — see the arrangement computed instead.
    const arrangedSchema: JSONTableSchema = {
      ...schema,
      tables: [
        arranged("acl.analysis", 0, 0),
        arranged("acl.analysis_liquid", 4000, 9000),
        arranged("acl.gas_dynamic_research", 12000, 300),
      ],
    };

    const result = filterSchema(arrangedSchema, ["acl.analysis"]);

    expect(result.ok).toBe(true);

    const kept = result.ok ? result.schema.tables : [];

    expect(kept.map((t) => t.name)).toEqual(["acl.analysis"]);
    expect(kept[0]).not.toHaveProperty("fromMetaInfo");
    expect(kept[0]).not.toHaveProperty("metaInfoPositions");
  });

  it("keeps the file's layout when the filter named every table", () => {
    // Nothing was left out, so the arrangement still describes this diagram.
    const arrangedSchema: JSONTableSchema = {
      ...schema,
      tables: [
        arranged("acl.analysis", 10, 20),
        arranged("acl.analysis_liquid", 30, 40),
        arranged("acl.gas_dynamic_research", 50, 60),
      ],
    };

    const result = filterSchema(arrangedSchema, [
      "acl.analysis",
      "acl.analysis_liquid",
      "acl.gas_dynamic_research",
    ]);

    expect(result.ok && result.schema.tables[0]).toEqual(
      expect.objectContaining({ fromMetaInfo: true, x: 10, y: 20 }),
    );
  });
});
