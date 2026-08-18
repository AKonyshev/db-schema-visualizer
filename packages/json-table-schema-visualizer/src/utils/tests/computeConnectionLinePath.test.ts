import {
  computeConnectionLinePath,
  computeConnectionPathWithSymbols,
} from "../computeConnectionPaths";

import { Position } from "@/types/positions";
import { DEFAULT_RELATION_STYLE, RelationStyle } from "@/types/relationStyle";

const geometry = {
  sourceXY: { x: 0, y: 0 },
  sourcePosition: Position.Right,
  targetXY: { x: 300, y: 120 },
  targetPosition: Position.Left,
};

describe("computeConnectionLinePath", () => {
  test("draws a curve unless told otherwise", () => {
    const line = computeConnectionLinePath(geometry);

    expect(line).toMatch(/^M/);
    // A cubic is what a bezier is, and what right angles never produce.
    expect(line).toContain("C");
  });

  test("draws right angles when the reader has chosen them", () => {
    const line = computeConnectionLinePath({
      ...geometry,
      style: RelationStyle.Orthogonal,
    });

    expect(line).not.toContain("C");
    // Quadratics round the corners.
    expect(line).toContain("Q");
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

describe("the default relation style", () => {
  test("is what an unset preference falls back to everywhere", () => {
    // The toolbar, the connection and the layout each need this value, and a
    // copy in any one of them would drift from the others in silence.
    expect(DEFAULT_RELATION_STYLE).toBe(RelationStyle.Bezier);

    const byDefault = computeConnectionLinePath(geometry);
    const explicit = computeConnectionLinePath({
      ...geometry,
      style: DEFAULT_RELATION_STYLE,
    });

    expect(byDefault).toBe(explicit);
  });
});
