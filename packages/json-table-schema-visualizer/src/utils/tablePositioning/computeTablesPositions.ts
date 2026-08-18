import { computeTableDimension } from "../computeTableDimension";

import { getLayoutEdges } from "./getLayoutEdges";
import { layoutAroundHubs } from "./hubLayout";

import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";

import { TABLES_GAP_X, TABLES_GAP_Y } from "@/constants/sizing";
import { type XYWHPosition } from "@/types/positions";
import { type RelationStyle } from "@/types/relationStyle";

/**
 * Where the tables go when the diagram is arranged for the reader.
 *
 * This used to be dagre. Dagre is a layered drawer: it packs a rank along one
 * axis, which turns a schema whose tables mostly share a rank into a strip —
 * a real one measured 1,980 wide by 145,826 tall, at which fit-to-view shows a
 * blank canvas. What a schema wants instead is a busy table in the middle with
 * its relations either side of it, so that is what `layoutAroundHubs` draws.
 *
 * `hiddenRelations` names the tables whose relations the reader has hidden.
 * They are laid out as though they had none, which is what hiding them means.
 *
 * `style` is what the relations will be drawn as, which decides how much room
 * they need between the tables: right angles want corridors, curves do not.
 */
const computeTablesPositions = (
  tables: JSONTableTable[],
  refs: JSONTableRef[],
  hiddenRelations?: ReadonlySet<string>,
  style?: RelationStyle,
): Map<string, XYWHPosition> => {
  if (tables.length === 0) {
    return new Map<string, XYWHPosition>();
  }

  const boxes = tables.map((table) => {
    const { width, height } = computeTableDimension(table);

    return { name: table.name, w: width, h: height };
  });

  const edges = getLayoutEdges(tables, refs).filter(
    ([source, target]) =>
      hiddenRelations == null ||
      (!hiddenRelations.has(source) && !hiddenRelations.has(target)),
  );

  const placed = layoutAroundHubs(boxes, edges, undefined, style);

  const positions = new Map<string, XYWHPosition>();
  placed.forEach((box) => {
    positions.set(box.name, {
      x: box.x + TABLES_GAP_X,
      y: box.y + TABLES_GAP_Y,
      w: box.w,
      h: box.h,
    });
  });

  return positions;
};

export default computeTablesPositions;
