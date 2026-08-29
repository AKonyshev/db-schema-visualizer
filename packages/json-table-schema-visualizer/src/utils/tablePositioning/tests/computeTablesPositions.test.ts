import computeTablesPositions from "../computeTablesPositions";

import { TableDetailLevel } from "@/types/tableDetailLevel";
import { exampleData } from "@/fake/fakeJsonTables";

jest.mock("../../computeTableDimension", () => ({
  computeTableDimension: () => ({
    width: 200,
    height: 150,
  }),
}));

describe("computeTablesPositions", () => {
  test("keeps coordinates non-negative and unique per table", () => {
    const map = computeTablesPositions(
      exampleData.tables,
      [],
      TableDetailLevel.FullDetails,
    );

    expect(map.size).toBe(exampleData.tables.length);

    const coords = Array.from(map.values());
    coords.forEach(({ x, y }) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
    });

    const uniqueKeys = new Set(coords.map(({ x, y }) => `${x}-${y}`));
    expect(uniqueKeys.size).toBe(coords.length);
  });

  test("carries each table's own size through", () => {
    const map = computeTablesPositions(
      exampleData.tables,
      [],
      TableDetailLevel.FullDetails,
    );

    Array.from(map.values()).forEach(({ w, h }) => {
      expect(w).toBe(200);
      expect(h).toBe(150);
    });
  });

  // Hiding a table's relations should change where it lands, not just what is
  // drawn: it belongs with the tables that have no relations.
  test("lays a table whose relations are hidden out as an unrelated one", () => {
    const ref = exampleData.refs[0];
    const owner = ref.endpoints[0].tableName;

    const shown = computeTablesPositions(
      exampleData.tables,
      [ref],
      TableDetailLevel.FullDetails,
    );
    const hidden = computeTablesPositions(
      exampleData.tables,
      [ref],
      TableDetailLevel.FullDetails,
      new Set([owner]),
    );

    expect(hidden.size).toBe(shown.size);
    expect(hidden.get(owner)).not.toEqual(shown.get(owner));
  });

  test("returns nothing for no tables", () => {
    expect(
      computeTablesPositions([], [], TableDetailLevel.FullDetails).size,
    ).toBe(0);
  });
});
