import { renderDiffMarkdown } from "../renderDiffMarkdown";

import type { SchemaDiff } from "../model";

const empty: SchemaDiff = {
  tablesOnlyInDbml: [],
  tablesOnlyInDatabase: [],
  columnDiffs: [],
  enumsOnlyInDbml: [],
  enumsOnlyInDatabase: [],
  enumValueDiffs: [],
  refsOnlyInDbml: [],
  refsOnlyInDatabase: [],
  indexDiffs: [],
  identical: true,
};

describe("renderDiffMarkdown", () => {
  test("renders an identical banner when there are no differences", () => {
    const md = renderDiffMarkdown(empty);
    expect(md).toContain("Schemas are identical");
  });

  test("renders sections for present differences only", () => {
    const diff: SchemaDiff = {
      ...empty,
      identical: false,
      tablesOnlyInDatabase: ["audit"],
      columnDiffs: [
        {
          table: "pump",
          onlyInDbml: ["id"],
          onlyInDatabase: [],
          changed: [
            {
              column: "amount",
              model: {
                name: "amount",
                type: "numeric",
                nullable: false,
                pk: false,
              },
              database: {
                name: "amount",
                type: "integer",
                nullable: true,
                pk: false,
              },
              differs: ["type", "nullable"],
            },
          ],
        },
      ],
    };
    const md = renderDiffMarkdown(diff);
    expect(md).toContain("Tables only in database");
    expect(md).toContain("audit");
    expect(md).toContain("pump");
    expect(md).toContain("amount");
    expect(md).toContain("numeric");
    expect(md).toContain("integer");
    // an empty section must not appear
    expect(md).not.toContain("Tables only in DBML");
  });
});
