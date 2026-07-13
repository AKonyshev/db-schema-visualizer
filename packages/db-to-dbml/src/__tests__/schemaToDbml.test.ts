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
    const result = schemaToDbml(twoSchemaFixture(), "public");
    expect(result.dbml).toBe("GENERATED_DBML");
    expect(result.droppedCrossSchemaRefs).toBe(1);

    const passed = generateDbml.mock.calls[0][0];
    expect(passed.tables.map((t) => t.name)).toEqual(["users", "orders"]);
  });
});
