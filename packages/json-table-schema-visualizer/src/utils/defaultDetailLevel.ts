import type { JSONTableTable } from "shared/types/tableSchema";

import { TableDetailLevel } from "@/types/tableDetailLevel";

/**
 * Above this many columns, opening at full detail is not a view anyone can use.
 *
 * Every column row costs about eight Konva nodes, and a redraw walks all of
 * them. Measured on a 117-table, 5,676-column schema: 46,210 nodes, ~74 ms to
 * draw the scene and ~58 ms more for the hit graph — about seven frames a
 * second, so panning, zooming and hovering all stutter. The same schema opened
 * with headers only is 821 nodes and ~12 ms.
 *
 * The threshold is that budget read backwards: roughly a thousand columns is
 * where a redraw stops fitting in a frame.
 */
export const FULL_DETAIL_COLUMN_BUDGET = 1000;

/**
 * Which detail level a document should open at when the reader has no saved
 * preference for it.
 *
 * Only ever a default. A reader who presses `D` owns the level from then on —
 * it is stored per document, and this is not consulted again.
 */
export const defaultDetailLevelFor = (
  tables: JSONTableTable[],
): TableDetailLevel => {
  const columns = tables.reduce(
    (total, table) => total + table.fields.length,
    0,
  );

  return columns > FULL_DETAIL_COLUMN_BUDGET
    ? TableDetailLevel.HeaderOnly
    : TableDetailLevel.FullDetails;
};
