import computeTablesPositions from "../computeTablesPositions";
import { getLayoutEdges } from "../getLayoutEdges";

import { TableDetailLevel } from "@/types/tableDetailLevel";
import { exampleData } from "@/fake/fakeJsonTables";

jest.mock("../getLayoutEdges", () => ({
  getLayoutEdges: jest.fn(() => [] as Array<[string, string]>),
}));

jest.mock("../../computeTableDimension", () => ({
  computeTableDimension: () => ({ width: 200, height: 150 }),
}));

test("computeTablesPositions delegates edge selection to getLayoutEdges", () => {
  const refs: never[] = [];
  computeTablesPositions(
    exampleData.tables,
    refs,
    TableDetailLevel.FullDetails,
  );
  expect(getLayoutEdges).toHaveBeenCalledWith(exampleData.tables, refs);
});
