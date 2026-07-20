import { generateAsciiDoc } from "./exportAsciiDoc";

describe("generateAsciiDoc", () => {
  test("generates table and relation sections", () => {
    const result = generateAsciiDoc(
      [
        {
          name: "users",
          x: 0,
          y: 0,
          fields: [
            {
              name: "id",
              type: { type_name: "int", is_enum: false },
              is_relation: false,
            },
          ],
          indexes: [],
        },
      ],
      [
        {
          endpoints: [
            { relation: "1", tableName: "users", fieldNames: ["id"] },
            { relation: "*", tableName: "orders", fieldNames: ["user_id"] },
          ],
        },
      ],
    );

    expect(result).toContain("== Table reference");
    expect(result).toContain("=== users");
    expect(result).toContain("| id | int |");
    expect(result).toContain("==== Relations:");
  });
});
