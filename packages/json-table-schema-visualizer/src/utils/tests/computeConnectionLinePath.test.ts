import {
  computeConnectionLinePath,
  computeConnectionPathWithSymbols,
} from "../computeConnectionPaths";

import { Position } from "@/types/positions";

const geometry = {
  sourceXY: { x: 0, y: 0 },
  sourcePosition: Position.Right,
  targetXY: { x: 300, y: 120 },
  targetPosition: Position.Left,
};

describe("computeConnectionLinePath", () => {
  test("returns a path made of right angles", () => {
    const line = computeConnectionLinePath(geometry);

    expect(line).toMatch(/^M/);
    // Quadratics round the corners; a cubic would mean the old curve is back.
    expect(line).not.toContain("C");
    expect(line).toContain("Q");
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
