import { type JSONTableSchema } from "shared/types/tableSchema";

import { filterSchema } from "../filterSchema";

const table = (name: string): JSONTableSchema["tables"][number] => ({
  name,
  fields: [],
  indexes: [],
  x: 0,
  y: 0,
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
});
