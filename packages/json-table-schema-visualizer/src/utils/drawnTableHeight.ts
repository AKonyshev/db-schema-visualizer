import { filterByDetailLevel } from "./filterByDetailLevel";

import type { JSONTableField } from "shared/types/tableSchema";

import {
  COLUMN_HEIGHT,
  PADDINGS,
  TABLE_HEADER_HEIGHT,
} from "@/constants/sizing";
import { type TableDetailLevel } from "@/types/tableDetailLevel";

/**
 * How tall a table is on the canvas at a given detail level.
 *
 * The one place that answers this. `Table` draws itself this tall and
 * `computeDiagramBounds` frames it this tall, and the two have to agree: the
 * height that decides fit-to-view's scale is the height the reader will see,
 * or the diagram ends up framed for a drawing that is not the one on screen.
 *
 * Not to be confused with `computeTableDimension`, which answers the same
 * question for the *layout* — where the tables go is settled once, at full
 * detail, so that pressing `D` rearranges nothing.
 */
export const drawnTableHeight = (
  fields: JSONTableField[],
  detailLevel: TableDetailLevel,
): number =>
  TABLE_HEADER_HEIGHT +
  filterByDetailLevel(fields, detailLevel).length * COLUMN_HEIGHT +
  PADDINGS.sm;
