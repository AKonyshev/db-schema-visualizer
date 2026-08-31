import {
  type JSONTableRef,
  type JSONTableTable,
} from "shared/types/tableSchema";

import { computeForeignKeyFields } from "../foreignKeys";

const field = (name: string, pk = false): JSONTableTable["fields"][number] => ({
  name,
  pk,
  type: { type_name: "integer", is_enum: false },
  is_relation: false,
});

const table = (
  name: string,
  fields: Array<[string, boolean]>,
): JSONTableTable => ({
  name,
  fields: fields.map(([fieldName, pk]) => field(fieldName, pk)),
  indexes: [],
  x: 0,
  y: 0,
});

const TABLES = [
  table("analysis", [["id", true]]),
  table("analysis_liquid", [
    ["id", true],
    ["analysis_id", false],
  ]),
];

const ref = (
  source: [string, string, "1" | "*"],
  target: [string, string, "1" | "*"],
): JSONTableRef => ({
  endpoints: [
    { tableName: source[0], fieldNames: [source[1]], relation: source[2] },
    { tableName: target[0], fieldNames: [target[1]], relation: target[2] },
  ],
});

describe("computeForeignKeyFields", () => {
  it("marks the many side of a one-to-many relation", () => {
    const keys = computeForeignKeyFields(TABLES, [
      ref(["analysis", "id", "1"], ["analysis_liquid", "analysis_id", "*"]),
    ]);

    expect([...keys]).toEqual(["analysis_liquid.analysis_id"]);
  });

  it("reads the relation, not the order the endpoints came in", () => {
    const keys = computeForeignKeyFields(TABLES, [
      ref(["analysis_liquid", "analysis_id", "*"], ["analysis", "id", "1"]),
    ]);

    expect([...keys]).toEqual(["analysis_liquid.analysis_id"]);
  });

  it("takes the side that is not a primary key when both are one", () => {
    // A one-to-one relation: neither endpoint says "many", so the relation
    // cannot say which side holds the key. The column that is its table's
    // primary key is the one being pointed at.
    const keys = computeForeignKeyFields(TABLES, [
      ref(["analysis", "id", "1"], ["analysis_liquid", "analysis_id", "1"]),
    ]);

    expect([...keys]).toEqual(["analysis_liquid.analysis_id"]);
  });

  it("marks nothing when a one-to-one names two primary keys", () => {
    // Table inheritance, written as `Ref: a.id - b.id`. Both are primary keys
    // of their own table and either could be the one carrying the constraint;
    // marking a guess would be worse than marking neither.
    const keys = computeForeignKeyFields(TABLES, [
      ref(["analysis", "id", "1"], ["analysis_liquid", "id", "1"]),
    ]);

    expect([...keys]).toEqual([]);
  });

  it("marks nothing when a one-to-one names two ordinary columns", () => {
    const keys = computeForeignKeyFields(
      [table("a", [["x", false]]), table("b", [["y", false]])],
      [ref(["a", "x", "1"], ["b", "y", "1"])],
    );

    expect([...keys]).toEqual([]);
  });

  it("collects every relation on the diagram", () => {
    const keys = computeForeignKeyFields(TABLES, [
      ref(["analysis", "id", "1"], ["analysis_liquid", "analysis_id", "*"]),
      ref(["analysis", "id", "1"], ["analysis_liquid", "id", "*"]),
    ]);

    expect([...keys].sort()).toEqual([
      "analysis_liquid.analysis_id",
      "analysis_liquid.id",
    ]);
  });

  it("survives a relation naming a table the diagram does not hold", () => {
    // A filtered diagram — the embedded frame draws a slice of a model — can
    // keep a relation whose other end was left out.
    const keys = computeForeignKeyFields(TABLES, [
      ref(["gone", "id", "1"], ["also_gone", "gone_id", "1"]),
    ]);

    expect([...keys]).toEqual([]);
  });
});
