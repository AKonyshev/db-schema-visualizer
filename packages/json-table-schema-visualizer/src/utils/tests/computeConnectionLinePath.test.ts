import {
  computeConnectionLinePath,
  computeConnectionPathWithSymbols,
} from "../computeConnectionPaths";

import { Position } from "@/types/positions";
import { RelationStyle } from "@/types/relationStyle";

const geometry = {
  sourceXY: { x: 0, y: 0 },
  sourcePosition: Position.Right,
  targetXY: { x: 300, y: 120 },
  targetPosition: Position.Left,
};

describe("computeConnectionLinePath", () => {
  test("draws right angles unless told otherwise", () => {
    const line = computeConnectionLinePath(geometry);

    expect(line).toMatch(/^M/);
    // Quadratics round the corners; a cubic would mean it drew the curve.
    expect(line).not.toContain("C");
    expect(line).toContain("Q");
  });

  test("draws a curve when the reader has chosen one", () => {
    const line = computeConnectionLinePath({
      ...geometry,
      style: RelationStyle.Bezier,
    });

    // A cubic is what a bezier is, and what right angles never produce.
    expect(line).toContain("C");
  });

  test("the two styles are actually different paths", () => {
    const angles = computeConnectionLinePath({
      ...geometry,
      style: RelationStyle.Orthogonal,
    });
    const curve = computeConnectionLinePath({
      ...geometry,
      style: RelationStyle.Bezier,
    });

    expect(angles).not.toBe(curve);
    // Both still start and end at the table edges they were given.
    [angles, curve].forEach((path) => {
      expect(path.startsWith("M0,0")).toBe(true);
      expect(path.endsWith("L300,120")).toBe(true);
    });
  });

  test("returns only the line, and the combined path starts with it", () => {
    const line = computeConnectionLinePath(geometry);
    const withSymbols = computeConnectionPathWithSymbols({
      ...geometry,
      relationSource: "1",
      relationTarget: "*",
    });

    expect(withSymbols.startsWith(line)).toBe(true);
    expect(withSymbols.length).toBeGreaterThan(line.length);
  });
});
