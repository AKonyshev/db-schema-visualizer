import { schemaToDbml } from "../schemaToDbml";

import { twoSchemaFixture } from "./fixtures";

import type { DatabaseSchema } from "../types";

const generateDbml = jest.fn<string, [DatabaseSchema]>(() => "GENERATED_DBML");
jest.mock("@dbml/core", () => ({
  importer: {
    generateDbml: (schema: unknown) => generateDbml(schema as DatabaseSchema),
  },
}));

describe("schemaToDbml", () => {
  beforeEach(() => generateDbml.mockClear());

  test("passes the filtered schema to importer.generateDbml and returns its output", () => {
    const result = schemaToDbml(twoSchemaFixture(), ["public"]);
    expect(result.dbml).toBe("GENERATED_DBML");
    expect(result.droppedCrossSchemaRefs).toBe(1);

    const passed = generateDbml.mock.calls[0][0];
    expect((passed.tables ?? []).map((t) => t.name)).toEqual([
      "users",
      "orders",
    ]);
  });

  test("hands the generator both schemas and the ref between them", () => {
    const result = schemaToDbml(twoSchemaFixture(), ["public", "audit"]);

    // The generator is mocked here, so what this unit owns is the schema it
    // passes on: both schemas' tables, and the ref across them kept rather than
    // counted. That the generated text qualifies the non-default schema is
    // @dbml/core's job, and the live suite reads it back off a real database.
    expect(result.droppedCrossSchemaRefs).toBe(0);

    const passed = generateDbml.mock.calls[0][0];
    expect((passed.tables ?? []).map((t) => t.name)).toEqual([
      "users",
      "orders",
      "logs",
    ]);
    expect(passed.refs).toHaveLength(3);
  });
});
