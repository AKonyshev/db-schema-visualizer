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
 * Below this many screen pixels a column row carries no readable text, so
 * drawing 5,676 of them is work nobody can see. Two glyph heights is generous;
 * the row is unreadable well before it.
 */
const LEGIBLE_ROW_PX = 8;

/** How much beyond the viewport stays mounted, in viewports per side. */
const CULLING_MARGIN = 0.5;

/**
 * Whether a column row is currently big enough to read.
 *
 * The table's footprint deliberately does not depend on this: heights that
 * changed with zoom would move every connection anchor and shift the bounds
 * that fit-to-view is computed from, which can oscillate around the threshold.
 * Only whether the rows are drawn depends on it.
 */
export const useIsRowTextLegible = (): boolean =>
  useSyncExternalStore(
    viewportStore.subscribe,
    () => viewportStore.get().scale * COLUMN_HEIGHT >= LEGIBLE_ROW_PX,
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
 * `useIsRowTextLegible` instead; zoomed in far enough to read a column, it is a
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
