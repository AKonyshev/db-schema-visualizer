import { computeTableDimension } from "../computeTableDimension";

import { exampleData } from "@/fake/fakeJsonTables";
import {
  TABLE_HEADER_HEIGHT,
  TABLE_DEFAULT_MIN_WIDTH,
  COLUMN_HEIGHT,
  PADDINGS,
} from "@/constants/sizing";
import { TableDetailLevel } from "@/types/tableDetailLevel";

jest.mock("../computeTextSize", () => ({
  computeTextSize: jest.fn((text: string) => ({
    width: text.length,
    height: 10,
  })),
}));

describe("compute table dimension", () => {
  test("measures a table as it will be drawn at full detail", () => {
    const table = exampleData.tables[0];
    // `PADDINGS.sm` is new here, and is a correction rather than a change: the
    // layout used to leave it out while `Table` drew it, so every box was
    // measured eight pixels shorter than the table that went in it.
    const expectedHeight =
      TABLE_HEADER_HEIGHT + COLUMN_HEIGHT * table.fields.length + PADDINGS.sm;

    expect(computeTableDimension(table, TableDetailLevel.FullDetails)).toEqual({
      width: TABLE_DEFAULT_MIN_WIDTH,
      height: expectedHeight,
    });
  });

  test("measures a table by its header alone when that is all that is drawn", () => {
    const table = exampleData.tables[0];

    expect(computeTableDimension(table, TableDetailLevel.HeaderOnly)).toEqual({
      // The width is the same: a table does not narrow because its columns are
      // hidden, so it does not shift under the reader for an invisible reason.
      width: TABLE_DEFAULT_MIN_WIDTH,
      height: TABLE_HEADER_HEIGHT + PADDINGS.sm,
    });
  });
});
