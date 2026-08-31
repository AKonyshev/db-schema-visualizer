import { groupDragPositions } from "../groupDragPositions";

import { type XYPosition } from "@/types/positions";

const STARTS = new Map<string, XYPosition>([
  ["a", { x: 10, y: 20 }],
  ["b", { x: 100, y: 200 }],
]);

describe("groupDragPositions", () => {
  it("shifts every table by the same delta", () => {
    expect([...groupDragPositions(STARTS, { x: 5, y: -5 })]).toEqual([
      ["a", { x: 15, y: 15 }],
      ["b", { x: 105, y: 195 }],
    ]);
  });

  it("keeps the tables where they were for a delta of nothing", () => {
    expect([...groupDragPositions(STARTS, { x: 0, y: 0 })]).toEqual([
      ["a", { x: 10, y: 20 }],
      ["b", { x: 100, y: 200 }],
    ]);
  });

  it("leaves the starting positions untouched", () => {
    // They are read again on the next pointer move, of which a drag makes
    // dozens: computing from a mutated start would compound the delta and send
    // the group off the canvas.
    groupDragPositions(STARTS, { x: 5, y: 5 });

    expect(STARTS.get("a")).toEqual({ x: 10, y: 20 });
  });

  it("has nothing to say about an empty group", () => {
    expect(
      groupDragPositions(new Map<string, XYPosition>(), { x: 5, y: 5 }).size,
    ).toBe(0);
  });
});
