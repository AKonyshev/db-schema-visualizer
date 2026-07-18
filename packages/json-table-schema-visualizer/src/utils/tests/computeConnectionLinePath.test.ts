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
  test("returns a bezier path", () => {
    expect(computeConnectionLinePath(geometry)).toMatch(/^M/);
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
