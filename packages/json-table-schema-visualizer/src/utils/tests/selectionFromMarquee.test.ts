import {
  normalizeMarquee,
  selectionFromMarquee,
} from "../selectionFromMarquee";

import { type XYWHPosition } from "@/types/positions";

// Three tables in a row, a hundred apart, each a hundred wide.
const BOXES = new Map<string, XYWHPosition>([
  ["left", { x: 0, y: 0, w: 100, h: 100 }],
  ["middle", { x: 200, y: 0, w: 100, h: 100 }],
  ["right", { x: 400, y: 0, w: 100, h: 100 }],
]);

const NOTHING = new Set<string>();

describe("normalizeMarquee", () => {
  it("leaves a rectangle dragged right and down alone", () => {
    expect(normalizeMarquee({ x: 10, y: 20, w: 30, h: 40 })).toEqual({
      x: 10,
      y: 20,
      w: 30,
      h: 40,
    });
  });

  it("turns a rectangle dragged up and left the right way round", () => {
    // Konva reports the drag as it happened; every test below wants a box with
    // its origin at the top left.
    expect(normalizeMarquee({ x: 40, y: 60, w: -30, h: -40 })).toEqual({
      x: 10,
      y: 20,
      w: 30,
      h: 40,
    });
  });
});

describe("selectionFromMarquee", () => {
  it("catches a table the marquee covers", () => {
    const selected = selectionFromMarquee(
      BOXES,
      { x: -10, y: -10, w: 130, h: 130 },
      false,
      NOTHING,
    );

    expect([...selected]).toEqual(["left"]);
  });

  it("catches a table the marquee only clips", () => {
    // Intersection, not containment: tables are large, and on a zoomed-out
    // diagram a marquee that had to swallow one whole could not be drawn.
    const selected = selectionFromMarquee(
      BOXES,
      { x: 50, y: 50, w: 200, h: 10 },
      false,
      NOTHING,
    );

    expect([...selected].sort()).toEqual(["left", "middle"]);
  });

  it("leaves a table the marquee merely touches at the edge", () => {
    // Sharing an edge is not overlapping, and a marquee dragged to a table's
    // border has not reached it yet.
    const selected = selectionFromMarquee(
      BOXES,
      { x: -50, y: 0, w: 50, h: 100 },
      false,
      NOTHING,
    );

    expect([...selected]).toEqual([]);
  });

  it("reads a marquee dragged up and left", () => {
    const selected = selectionFromMarquee(
      BOXES,
      { x: 250, y: 50, w: -200, h: -10 },
      false,
      NOTHING,
    );

    expect([...selected].sort()).toEqual(["left", "middle"]);
  });

  it("replaces what was selected before", () => {
    const selected = selectionFromMarquee(
      BOXES,
      { x: 400, y: 0, w: 100, h: 100 },
      false,
      new Set(["left"]),
    );

    expect([...selected]).toEqual(["right"]);
  });

  it("adds to what was selected before when asked", () => {
    const selected = selectionFromMarquee(
      BOXES,
      { x: 400, y: 0, w: 100, h: 100 },
      true,
      new Set(["left"]),
    );

    expect([...selected].sort()).toEqual(["left", "right"]);
  });

  it("empties the selection when the marquee caught nothing", () => {
    // A click on empty canvas is a marquee of no size, and this is what makes
    // it clear the selection without a second code path.
    const selected = selectionFromMarquee(
      BOXES,
      { x: 150, y: 150, w: 0, h: 0 },
      false,
      new Set(["left", "middle"]),
    );

    expect([...selected]).toEqual([]);
  });

  it("keeps the selection when a click is made with the modifier held", () => {
    const selected = selectionFromMarquee(
      BOXES,
      { x: 150, y: 150, w: 0, h: 0 },
      true,
      new Set(["left"]),
    );

    expect([...selected]).toEqual(["left"]);
  });

  it("ignores a table with no measured box", () => {
    // `tableCoordsStore` starts a table at zero width and height until it has
    // been drawn once. Such a table is not on screen to be caught.
    const selected = selectionFromMarquee(
      new Map([["unmeasured", { x: 0, y: 0, w: 0, h: 0 }]]),
      { x: -10, y: -10, w: 100, h: 100 },
      false,
      NOTHING,
    );

    expect([...selected]).toEqual([]);
  });
});
