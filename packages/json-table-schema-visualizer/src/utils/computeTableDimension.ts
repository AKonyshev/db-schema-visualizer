import { type JSONTableTable } from "shared/types/tableSchema";

import { computeTableLineWidths } from "./tableWComputation/computeTableLineWidths";
import { computeTablePreferredWidth } from "./tableWComputation/computeTablePreferredWidth";
import { drawnTableHeight } from "./drawnTableHeight";

import { type TableDetailLevel } from "@/types/tableDetailLevel";
import { type Dimension } from "@/types/dimension";

/**
 * How much room a table takes on the canvas, for the layout to place it by.
 *
 * The height is the height it will be drawn at, which is why the detail level
 * is not optional: it decided nothing here until the layout started being
 * recomputed per level, and a default would have quietly gone on laying out
 * headers as though every column were still there — the exact arrangement this
 * argument exists to stop.
 *
 * The width does not move with the level. A table is drawn as wide as its
 * widest column line whether or not the lines are showing, so that a table does
 * not change width under the reader for a reason they cannot see.
 *
 * `foreignKeys` is what decides whether a line carries an `FK` badge, and so
 * how wide it is; see `computeForeignKeyFields`.
 */
export const computeTableDimension = (
  table: JSONTableTable,
  detailLevel: TableDetailLevel,
  foreignKeys: ReadonlySet<string>,
): Dimension => {
  const lineWidths = computeTableLineWidths(table, foreignKeys);
  const width = computeTablePreferredWidth(lineWidths, table.name);

  return { width, height: drawnTableHeight(table.fields, detailLevel) };
};
