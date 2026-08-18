import { TABLES_GAP_X, TABLES_GAP_Y } from "@/constants/sizing";

export interface PackedBox {
  name: string;
  w: number;
  h: number;
}

export interface PlacedBox extends PackedBox {
  x: number;
  y: number;
}

/**
 * Roughly how much wider than tall a diagram should end up.
 *
 * Rows come out ragged — a row is as tall as the tallest table in it — so the
 * packed result is squarer than this asks for. Aiming at 2 lands near 1.5,
 * which is about the shape of a window.
 */
export const TARGET_ASPECT = 2;

/**
 * The band of shapes worth keeping.
 *
 * Outside it the layout is a strip: readable in one direction and unreachable
 * in the other. A 117-table schema came out 108 times taller than it was wide.
 */
export const MIN_ASPECT = 1 / 4;
export const MAX_ASPECT = 4;

export const isDegenerateShape = (width: number, height: number): boolean => {
  if (width <= 0 || height <= 0) {
    return true;
  }

  const aspect = height / width;

  return aspect > MAX_ASPECT || aspect < MIN_ASPECT;
};

/**
 * Lay boxes out in rows, wrapping at a width chosen to hit `targetAspect`.
 *
 * The order is meaningful: it comes from the graph layout, so tables that
 * reference each other arrive next to each other and stay neighbours here.
 * What this discards is the graph's *placement*, which is the right trade only
 * when that placement has degenerated into a strip.
 */
export const shelfPack = (
  boxes: PackedBox[],
  targetAspect: number = TARGET_ASPECT,
): PlacedBox[] => {
  if (boxes.length === 0) {
    return [];
  }

  const area = boxes.reduce((total, box) => total + box.w * box.h, 0);
  // The widest single table still has to fit, or every row would hold one.
  const widest = boxes.reduce((max, box) => Math.max(max, box.w), 0);
  const targetWidth = Math.max(Math.sqrt(area * targetAspect), widest);

  const placed: PlacedBox[] = [];
  let x = 0;
  let y = 0;
  let rowHeight = 0;

  for (const box of boxes) {
    if (x > 0 && x + box.w > targetWidth) {
      x = 0;
      y += rowHeight + TABLES_GAP_Y;
      rowHeight = 0;
    }

    placed.push({ ...box, x, y });
    x += box.w + TABLES_GAP_X;
    rowHeight = Math.max(rowHeight, box.h);
  }

  return placed;
};
