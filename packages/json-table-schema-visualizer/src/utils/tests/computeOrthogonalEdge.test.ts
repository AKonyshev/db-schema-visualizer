import {
  getOrthogonalPath,
  orthogonalPoints,
  roundedPolyline,
} from "../computeEgde/computeOrthogonalEdge";

import { Position, type XYPosition } from "@/types/positions";

const at = (x: number, y: number): XYPosition => ({ x, y });

describe("orthogonalPoints", () => {
  test("runs straight when the two edges are level", () => {
    const points = orthogonalPoints(at(0, 100), 1, at(500, 100), -1, 20);

    expect(points.every((p) => p.y === 100)).toBe(true);
  });

  test("turns twice around a corridor between edges that face each other", () => {
    const points = orthogonalPoints(at(0, 0), 1, at(500, 300), -1, 20);

    // Out, across, down, in: the corridor sits between the two stubs.
    expect(points).toHaveLength(6);
    const corridor = points[2].x;
    expect(corridor).toBeGreaterThan(0);
    expect(corridor).toBeLessThan(500);
    expect(points[3].x).toBe(corridor);
    expect(points[2].y).toBe(0);
    expect(points[3].y).toBe(300);
  });

  test("every segment is either horizontal or vertical", () => {
    const points = orthogonalPoints(at(0, 0), 1, at(500, 300), -1, 20);

    points.slice(1).forEach((point, index) => {
      const previous = points[index];
      expect(point.x === previous.x || point.y === previous.y).toBe(true);
    });
  });

  test("reaches around when both edges face the same way", () => {
    // Two tables side by side, both attaching on their left.
    const points = orthogonalPoints(at(300, 0), -1, at(100, 400), -1, 20);
    const corridor = points[1].x;

    // Left of both, so the line never crosses back through either table.
    expect(corridor).toBeLessThan(100);
    expect(points[2].x).toBe(corridor);
  });

  test("reaches around to the right when both face right", () => {
    const points = orthogonalPoints(at(100, 0), 1, at(300, 400), 1, 20);

    expect(points[1].x).toBeGreaterThan(300);
  });
});

describe("roundedPolyline", () => {
  test("says nothing about no points", () => {
    expect(roundedPolyline([], 10)).toBe("");
  });

  test("draws straight lines when there is no corner to round", () => {
    expect(roundedPolyline([at(0, 0), at(10, 0)], 5)).toBe("M0,0 L10,0");
  });

  test("puts a curve at each corner", () => {
    const path = roundedPolyline([at(0, 0), at(100, 0), at(100, 100)], 10);

    expect(path).toContain("Q100,0");
  });

  test("keeps a corner from overshooting a short segment", () => {
    // The middle segment is 4 long; a radius of 50 must not run past it.
    const path = roundedPolyline([at(0, 0), at(4, 0), at(4, 200)], 50);
    const numbers = [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map(Number);

    expect(Math.max(...numbers)).toBeLessThanOrEqual(200);
    expect(path).not.toContain("NaN");
  });
});

describe("getOrthogonalPath", () => {
  test("starts at the table edge and ends at the other", () => {
    const path = getOrthogonalPath({
      source: at(0, 50),
      sourcePosition: Position.Right,
      target: at(600, 250),
      targetPosition: Position.Left,
    });

    expect(path.startsWith("M0,50")).toBe(true);
    expect(path.endsWith("L600,250")).toBe(true);
    expect(path).not.toContain("NaN");
  });

  test("square corners when asked for no radius", () => {
    const path = getOrthogonalPath({
      source: at(0, 0),
      sourcePosition: Position.Right,
      target: at(600, 250),
      targetPosition: Position.Left,
      radius: 0,
    });

    expect(path).not.toContain("Q");
  });
});
