import { ROW_WORTH_DRAWING_PX, rowsAreWorthDrawing } from "../rowsWorthDrawing";
import { FULL_DETAIL_COLUMN_BUDGET } from "../defaultDetailLevel";

import { COLUMN_HEIGHT } from "@/constants/sizing";

// The scale at which a column row is exactly at the legibility floor.
const AT_THE_FLOOR = ROW_WORTH_DRAWING_PX / COLUMN_HEIGHT;
const WELL_BELOW = AT_THE_FLOOR / 10;

describe("rowsAreWorthDrawing", () => {
  test("draws the rows of a small schema however far out the reader is", () => {
    // Three tables of forty columns is what a documentation page embeds when
    // its filter names three tables. Framed in a page-sized frame the diagram
    // sits well below the legibility floor, and hiding the rows there leaves
    // the reader looking at empty boxes — with nothing to zoom towards, because
    // the frame is the size the page's author made it.
    expect(rowsAreWorthDrawing({ scale: WELL_BELOW, columns: 120 })).toBe(true);
  });

  test("hides them on a schema large enough for the drawing to cost", () => {
    expect(
      rowsAreWorthDrawing({
        scale: WELL_BELOW,
        columns: FULL_DETAIL_COLUMN_BUDGET + 1,
      }),
    ).toBe(false);
  });

  test("draws them on a large schema once the reader is close enough", () => {
    expect(
      rowsAreWorthDrawing({
        scale: AT_THE_FLOOR,
        columns: FULL_DETAIL_COLUMN_BUDGET + 1,
      }),
    ).toBe(true);
  });

  test("holds the rows of a schema right at the budget", () => {
    expect(
      rowsAreWorthDrawing({
        scale: WELL_BELOW,
        columns: FULL_DETAIL_COLUMN_BUDGET,
      }),
    ).toBe(true);
  });
});
