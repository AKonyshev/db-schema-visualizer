import { type XYPosition } from "@/types/positions";

/**
 * Where each table of a dragged group is now.
 *
 * From the positions the group started the drag at plus one delta, rather than
 * from where each table currently is plus a step: a drag emits dozens of moves,
 * and accumulating a step per move compounds every rounding error until the
 * group drifts away from the pointer.
 */
export const groupDragPositions = (
  starts: ReadonlyMap<string, XYPosition>,
  delta: XYPosition,
): Map<string, XYPosition> => {
  const positions = new Map<string, XYPosition>();

  for (const [name, start] of starts) {
    positions.set(name, { x: start.x + delta.x, y: start.y + delta.y });
  }

  return positions;
};
