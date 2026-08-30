import { FULL_DETAIL_COLUMN_BUDGET } from "./defaultDetailLevel";

import { COLUMN_HEIGHT } from "@/constants/sizing";

/**
 * How tall a column row must be on screen before the rows are drawn at all.
 *
 * Not a legibility threshold, which is what it was first set to: long before a
 * name can be read, the rows still say how big a table is, where its keys sit
 * and which of them a relation arrives at, and a reader zooming out wants to
 * keep that for as long as the machine can afford it. Six pixels is about two
 * rows to a table's worth of banding — enough to read structure from, well
 * before a name resolves.
 */
export const ROW_WORTH_DRAWING_PX = 6;

/**
 * Whether the column rows are worth drawing at this zoom, on a schema this
 * size.
 *
 * The zoom alone decided this once, and on a large schema it still does: every
 * row costs about eight Konva nodes, a redraw walks all of them, and zooming
 * out is how a reader asks to see more of the schema at once. Culling the rows
 * is what keeps that affordable.
 *
 * But it is a budget, and a schema inside the budget has nothing to save.
 * Below `FULL_DETAIL_COLUMN_BUDGET` — the same measured figure that decides
 * whether a document may open at full detail, read here for the same reason —
 * every row can be drawn at any zoom without a redraw missing its frame.
 *
 * Which matters most exactly where the saving is worth least: a documentation
 * page embeds a frame a few hundred pixels tall showing the handful of tables
 * its filter named, and fitting those into it puts the rows below the floor.
 * The reader is then looking at empty boxes with no way to zoom towards them —
 * the frame is the size the page's author made it, and the columns are what
 * they came for.
 */
export const rowsAreWorthDrawing = ({
  scale,
  columns,
}: {
  scale: number;
  columns: number;
}): boolean =>
  columns <= FULL_DETAIL_COLUMN_BUDGET ||
  scale * COLUMN_HEIGHT >= ROW_WORTH_DRAWING_PX;
