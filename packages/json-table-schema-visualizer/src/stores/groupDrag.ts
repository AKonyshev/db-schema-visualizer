import { selectionStore } from "./selectionStore";
import { tableCoordsStore } from "./tableCoords";

import { type XYPosition } from "@/types/positions";
import eventEmitter from "@/events-emitter";
import { groupDragPositions } from "@/utils/groupDragPositions";

export const GROUP_DRAG_EVENT = "groupDrag:move";

export interface GroupDragMove {
  positions: Map<string, XYPosition>;
  /** The table the reader has hold of. Konva is already moving that one. */
  leader: string;
}

/**
 * A drag of several tables at once.
 *
 * The table under the pointer is dragged by Konva as it always was; this holds
 * where every other selected table started, so each of them can be told the one
 * delta and move itself. Each table stays the owner of its own node, which is
 * what keeps this out of react-konva's way.
 *
 * A module rather than a class: there is one drag in flight at a time, and its
 * whole lifetime is a single gesture.
 */
let starts: Map<string, XYPosition> | null = null;
let leaderStart: XYPosition | null = null;

export const beginGroupDrag = (leader: string): void => {
  // Only when the table being dragged is one of several the reader selected.
  // Dragging anything else is a single-table move, exactly as before.
  if (
    !selectionStore.isSelected(leader) ||
    selectionStore.getSelected().size < 2
  ) {
    return;
  }

  const positions = new Map<string, XYPosition>();

  for (const name of selectionStore.getSelected()) {
    const coords = tableCoordsStore.getFullCoords(name);

    positions.set(name, { x: coords.x, y: coords.y });
  }

  leaderStart = positions.get(leader) ?? null;
  starts = leaderStart === null ? null : positions;
};

export const moveGroupDrag = (leader: string, current: XYPosition): void => {
  if (starts === null || leaderStart === null) {
    return;
  }

  const positions = groupDragPositions(starts, {
    x: current.x - leaderStart.x,
    y: current.y - leaderStart.y,
  });

  // The leader is moving itself under the pointer; sending it a position would
  // fight Konva for the node.
  positions.delete(leader);

  const move: GroupDragMove = { positions, leader };

  eventEmitter.emit(GROUP_DRAG_EVENT, move);
};

export const endGroupDrag = (): void => {
  starts = null;
  leaderStart = null;
};

export const subscribeToGroupDrag = (
  handler: (move: GroupDragMove) => void,
): (() => void) => {
  eventEmitter.on(GROUP_DRAG_EVENT, handler);

  return () => {
    eventEmitter.off(GROUP_DRAG_EVENT, handler);
  };
};
