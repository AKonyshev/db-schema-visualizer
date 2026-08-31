import { type XYWHPosition } from "@/types/positions";

/**
 * The rectangle the reader is dragging, as Konva reports it: `w` and `h` are
 * negative when the drag went up or left.
 */
export interface Marquee {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The same rectangle with its origin at the top left. */
export const normalizeMarquee = (marquee: Marquee): Marquee => ({
  x: marquee.w < 0 ? marquee.x + marquee.w : marquee.x,
  y: marquee.h < 0 ? marquee.y + marquee.h : marquee.y,
  w: Math.abs(marquee.w),
  h: Math.abs(marquee.h),
});

const overlaps = (box: XYWHPosition, marquee: Marquee): boolean =>
  box.x < marquee.x + marquee.w &&
  box.x + box.w > marquee.x &&
  box.y < marquee.y + marquee.h &&
  box.y + box.h > marquee.y;

/**
 * The tables a marquee caught.
 *
 * Overlap rather than containment. Tables are large and a diagram is usually
 * looked at zoomed out: a marquee that had to swallow a table whole could not
 * be drawn around a cluster without also swallowing everything beside it.
 *
 * A marquee of no size is a click, and catches nothing — which is exactly what
 * makes a click on empty canvas clear the selection, with no second code path
 * to keep in step. Holding the modifier keeps what was there, so a click with
 * it held is a no-op rather than a way to lose the selection by accident.
 */
export const selectionFromMarquee = (
  boxes: ReadonlyMap<string, XYWHPosition>,
  marquee: Marquee,
  additive: boolean,
  previous: ReadonlySet<string>,
): Set<string> => {
  const box = normalizeMarquee(marquee);
  const caught = new Set<string>(additive ? previous : []);

  for (const [name, tableBox] of boxes) {
    // A table that has never been drawn has no size, and a zero-area box
    // overlaps nothing under the comparison above — but say so plainly rather
    // than leaning on that.
    if (tableBox.w <= 0 || tableBox.h <= 0) {
      continue;
    }

    if (overlaps(tableBox, box)) {
      caught.add(name);
    }
  }

  return caught;
};
