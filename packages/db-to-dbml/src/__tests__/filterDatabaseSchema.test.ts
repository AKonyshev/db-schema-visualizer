import { filterDatabaseSchema } from "../filterDatabaseSchema";

import { twoSchemaFixture } from "./fixtures";

import type { DatabaseSchema } from "../types";

describe("filterDatabaseSchema", () => {
  test("keeps only tables/enums of the target schema", () => {
    const { schema } = filterDatabaseSchema(twoSchemaFixture(), "public");
    expect(schema.tables.map((t) => t.name)).toEqual(["users", "orders"]);
    expect(schema.enums.map((e) => e.name)).toEqual(["user_role"]);
  });

  test("keeps only dictionary entries whose key is prefixed with the schema", () => {
    const { schema } = filterDatabaseSchema(twoSchemaFixture(), "public");
    expect(Object.keys(schema.fields)).toEqual([
      "public.users",
      "public.orders",
    ]);
    expect(Object.keys(schema.tableConstraints)).toEqual(["public.users"]);
    expect(Object.keys(schema.indexes)).toEqual(["public.orders"]);
    expect(Object.keys(schema.checks)).toEqual(["public.users"]);
  });

  test("keeps refs fully inside the schema and drops+counts cross-schema refs", () => {
    const { schema, droppedCrossSchemaRefs } = filterDatabaseSchema(
      twoSchemaFixture(),
      "public",
    );
    // only the orders->users ref survives; the cross-schema one is dropped
    expect(schema.refs).toHaveLength(1);
    expect(droppedCrossSchemaRefs).toBe(1);
  });

  test("a schema with no relation to the target contributes no dropped count", () => {
    const { droppedCrossSchemaRefs } = filterDatabaseSchema(
      twoSchemaFixture(),
      "audit",
    );
    // audit's cross ref is the same public->audit ref (touches audit) => counted once
    expect(droppedCrossSchemaRefs).toBe(1);
  });

  test("tolerates sections the connector omits (e.g. missing `checks`) without throwing", () => {
    // The real @dbml/connector output omits `checks` entirely when a database
    // has no check constraints (observed against a live TimescaleDB), and may
    // omit arrays too. filterDatabaseSchema must treat any nullish section as
    // empty rather than throwing on Object.entries(undefined).
    const partial = {
      tables: [{ name: "users", schemaName: "public" }],
      enums: [{ name: "role", schemaName: "public" }],
      // refs, tableConstraints, indexes, checks intentionally absent
      fields: { "public.users": [] },
    } as unknown as DatabaseSchema;

    const { schema, droppedCrossSchemaRefs } = filterDatabaseSchema(
      partial,
      "public",
    );

    expect(schema.tables.map((t) => t.name)).toEqual(["users"]);
    expect(schema.enums.map((e) => e.name)).toEqual(["role"]);
    expect(schema.refs).toEqual([]);
    expect(Object.keys(schema.fields)).toEqual(["public.users"]);
    expect(schema.tableConstraints).toEqual({});
    expect(schema.indexes).toEqual({});
    expect(schema.checks).toEqual({});
    expect(droppedCrossSchemaRefs).toBe(0);
  });

  test("a schema name that is a prefix of another schema does not leak its data", () => {
    // "pub" is a string-prefix of "public" but not a real schema in the fixture.
    // Guards against a naive `key.startsWith(schemaName)` (without the trailing
    // dot) matching "public.*" entries when filtering by "pub".
    const { schema, droppedCrossSchemaRefs } = filterDatabaseSchema(
      twoSchemaFixture(),
      "pub",
    );
    expect(schema.tables).toEqual([]);
    expect(schema.enums).toEqual([]);
    expect(schema.refs).toEqual([]);
    expect(droppedCrossSchemaRefs).toBe(0);
    expect(Object.keys(schema.fields)).toEqual([]);
    expect(Object.keys(schema.tableConstraints)).toEqual([]);
    expect(Object.keys(schema.indexes)).toEqual([]);
    expect(Object.keys(schema.checks)).toEqual([]);
  });
});
