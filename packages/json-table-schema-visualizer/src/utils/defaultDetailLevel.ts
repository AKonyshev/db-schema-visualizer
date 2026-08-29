import type { JSONTableTable } from "shared/types/tableSchema";

import { TableDetailLevel } from "@/types/tableDetailLevel";

/**
 * Above this many columns across the schema, opening at full detail is not a
 * view anyone can use.
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
 * Above this many columns in one table, opening at full detail is not a view
 * anyone can read — however few tables there are.
 *
 * The total above is a budget for the machine; this one is a budget for the
 * eye, and they catch different schemas. A column row is `COLUMN_HEIGHT` = 30px
 * tall, so a table of N columns is about 30N pixels — and fit-to-view shrinks
 * the whole diagram until the *tallest* table fits, however small that leaves
 * the rest. A column label is 15px, so it survives being halved and little
 * more; past scale 0.5 it stops being letters. Half of a 900px window is
 * 1,800px of diagram, which is 60 rows.
 *
 * The models this was measured against divide cleanly either side of it: a
 * median table has 7 columns, while the wide ones run 92, 136, 169, 204. Three
 * of those last make a schema that is small by every count except the one that
 * matters — 458 columns in total, comfortably inside the budget above, and six
 * thousand pixels tall, which in a 500px documentation frame is three
 * hairlines.
 */
export const FULL_DETAIL_TALLEST_TABLE_BUDGET = 60;

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
  const tallest = tables.reduce(
    (most, table) => Math.max(most, table.fields.length),
    0,
  );

  return columns > FULL_DETAIL_COLUMN_BUDGET ||
    tallest > FULL_DETAIL_TALLEST_TABLE_BUDGET
    ? TableDetailLevel.HeaderOnly
    : TableDetailLevel.FullDetails;
};
