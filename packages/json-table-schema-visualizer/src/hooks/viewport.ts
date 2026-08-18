import { useEffect, useState, useSyncExternalStore } from "react";

import type { JSONTableTable } from "shared/types/tableSchema";

import {
  COLUMN_HEIGHT,
  DIAGRAM_PADDING,
  PADDINGS,
  TABLE_COLOR_HEIGHT,
} from "@/constants/sizing";
import { tableCoordsStore } from "@/stores/tableCoords";
import {
  type Rect,
  rectsIntersect,
  viewportStore,
  visibleWorldRect,
} from "@/stores/viewportStore";

/**
 * How tall a column row must be on screen before the rows are drawn at all.
 *
 * Not a legibility threshold, which is what it was first set to: long before a
 * name can be read, the rows still say how big a table is, where its keys sit
 * and which of them a relation arrives at, and a reader zooming out wants to
 * keep that for as long as the machine can afford it. Six pixels is about two
 * rows to a table's worth of banding — enough to read structure from, well
 * before a name resolves.
 *
 * Affordable because of culling: at this zoom the viewport holds a fraction of
 * the schema, so the rows drawn are a fraction of its columns — on a
 * 5,676-column schema, thousands rather than all of them.
 */
const ROW_WORTH_DRAWING_PX = 6;

/** How much beyond the viewport stays mounted, in viewports per side. */
const CULLING_MARGIN = 0.5;

/**
 * Whether the columns are currently worth drawing.
 *
 * The table's footprint deliberately does not depend on this: heights that
 * changed with zoom would move every connection anchor and shift the bounds
 * that fit-to-view is computed from, which can oscillate around the threshold.
 * Only whether the rows are drawn depends on it.
 */
export const useAreRowsWorthDrawing = (): boolean =>
  useSyncExternalStore(
    viewportStore.subscribe,
    () => viewportStore.get().scale * COLUMN_HEIGHT >= ROW_WORTH_DRAWING_PX,
    () => true,
  );

/**
 * A width to assume before a table has been measured.
 *
 * Culling only needs bounds that are not too small, and the first pass runs
 * before any table has rendered itself: waiting for real measurements meant
 * mounting all 117 and never revisiting, because nothing moved afterwards to
 * ask again.
 */
const ASSUMED_TABLE_WIDTH = 400;

const boundsOf = (table: JSONTableTable): Rect => {
  const coords = tableCoordsStore.getFullCoords(table.name);

  return {
    x: coords.x + DIAGRAM_PADDING,
    y: coords.y + DIAGRAM_PADDING,
    w: coords.w > 0 ? coords.w : ASSUMED_TABLE_WIDTH,
    h:
      coords.h > 0
        ? coords.h
        : TABLE_COLOR_HEIGHT +
          COLUMN_HEIGHT +
          table.fields.length * COLUMN_HEIGHT +
          PADDINGS.sm,
  };
};

const selectVisible = (tables: JSONTableTable[]): JSONTableTable[] => {
  const view = visibleWorldRect(viewportStore.get(), CULLING_MARGIN);
  if (view === null) {
    return tables;
  }

  return tables.filter((table) => rectsIntersect(boundsOf(table), view));
};

const sameTables = (a: JSONTableTable[], b: JSONTableTable[]): boolean =>
  a.length === b.length && a.every((table, index) => table === b[index]);

/**
 * The tables worth mounting right now.
 *
 * At an overview zoom this is all of them and the saving comes from
 * `useAreRowsWorthDrawing` instead; zoomed in far enough to read a column, it is a
 * handful. Between them the work stays bounded at every scale, which is what a
 * 117-table schema needs and what no amount of memoising could give.
 */
export const useVisibleTables = (
  tables: JSONTableTable[],
): JSONTableTable[] => {
  const [visible, setVisible] = useState(() => selectVisible(tables));

  useEffect(() => {
    const sync = (): void => {
      const next = selectVisible(tables);
      // Returning the previous array tells React there is nothing to do, so
      // panning within the margin re-renders nothing at all.
      setVisible((prev) => (sameTables(prev, next) ? prev : next));
    };

    sync();

    return viewportStore.subscribe(sync);
  }, [tables]);

  return visible;
};
