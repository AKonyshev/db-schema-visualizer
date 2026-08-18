import {
  FULL_DETAIL_COLUMN_BUDGET,
  defaultDetailLevelFor,
} from "../defaultDetailLevel";

import type { JSONTableTable } from "shared/types/tableSchema";

import { TableDetailLevel } from "@/types/tableDetailLevel";

const tableWith = (columns: number, name = "t"): JSONTableTable =>
  ({
    name,
    fields: Array.from({ length: columns }, (_, i) => ({ name: `c${i}` })),
    indexes: [],
    x: 0,
    y: 0,
  }) as unknown as JSONTableTable;

describe("defaultDetailLevelFor", () => {
  test("opens an ordinary schema at full detail", () => {
    expect(defaultDetailLevelFor([tableWith(20), tableWith(30)])).toBe(
      TableDetailLevel.FullDetails,
    );
  });

  test("opens an empty schema at full detail", () => {
    expect(defaultDetailLevelFor([])).toBe(TableDetailLevel.FullDetails);
  });

  test("counts columns across tables, not tables", () => {
    // A hundred small tables are cheap; one wide table is not the only way to
    // get expensive.
    const many = Array.from({ length: 100 }, (_, i) => tableWith(5, `t${i}`));

    expect(defaultDetailLevelFor(many)).toBe(TableDetailLevel.FullDetails);
  });

  test("holds full detail right up to the budget", () => {
    expect(defaultDetailLevelFor([tableWith(FULL_DETAIL_COLUMN_BUDGET)])).toBe(
      TableDetailLevel.FullDetails,
    );
  });

  test("drops to headers one column past the budget", () => {
    expect(
      defaultDetailLevelFor([tableWith(FULL_DETAIL_COLUMN_BUDGET + 1)]),
    ).toBe(TableDetailLevel.HeaderOnly);
  });

  test("drops to headers for a schema the size of the measured one", () => {
    // 117 tables, 5,676 columns: 46,210 nodes and ~132 ms a redraw.
    const huge = Array.from({ length: 117 }, (_, i) => tableWith(48, `t${i}`));

    expect(defaultDetailLevelFor(huge)).toBe(TableDetailLevel.HeaderOnly);
  });
});
