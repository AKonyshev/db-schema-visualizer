import { listSchemaNames } from "../listSchemaNames";

import { twoSchemaFixture } from "./fixtures";

describe("listSchemaNames", () => {
  test("returns distinct schema names, sorted", () => {
    expect(listSchemaNames(twoSchemaFixture())).toEqual(["audit", "public"]);
  });

  test("includes schemas that only have enums", () => {
    const db = twoSchemaFixture();
    db.tables = db.tables.filter((t) => t.schemaName !== "audit");
    // audit still present via the log_level enum
    expect(listSchemaNames(db)).toEqual(["audit", "public"]);
  });
});
