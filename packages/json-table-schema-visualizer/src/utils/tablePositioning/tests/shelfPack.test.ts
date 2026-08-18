import {
  MAX_ASPECT,
  isDegenerateShape,
  shelfPack,
  type PackedBox,
} from "../shelfPack";

const boxes = (count: number, w: number, h: number): PackedBox[] =>
  Array.from({ length: count }, (_, i) => ({ name: `t${i}`, w, h }));

describe("isDegenerateShape", () => {
  test("accepts a diagram roughly the shape of a window", () => {
    expect(isDegenerateShape(1600, 900)).toBe(false);
    expect(isDegenerateShape(900, 1600)).toBe(false);
  });

  test("rejects a tall strip — the 117-table case", () => {
    expect(isDegenerateShape(1650, 146586)).toBe(true);
  });

  test("rejects a wide strip too", () => {
    expect(isDegenerateShape(32273, 4076)).toBe(true);
  });

  test("rejects an empty layout rather than dividing by zero", () => {
    expect(isDegenerateShape(0, 100)).toBe(true);
    expect(isDegenerateShape(100, 0)).toBe(true);
  });

  test("turns over exactly at the boundary", () => {
    expect(isDegenerateShape(100, 100 * MAX_ASPECT)).toBe(false);
    expect(isDegenerateShape(100, 100 * MAX_ASPECT + 1)).toBe(true);
  });
});

describe("shelfPack", () => {
  const spread = (
    placed: ReturnType<typeof shelfPack>,
  ): { w: number; h: number } => {
    const right = Math.max(...placed.map((b) => b.x + b.w));
    const bottom = Math.max(...placed.map((b) => b.y + b.h));

    return { w: right, h: bottom };
  };

  test("returns nothing for nothing", () => {
    expect(shelfPack([])).toEqual([]);
  });

  test("brings a tall strip back into a usable shape", () => {
    const placed = shelfPack(boxes(117, 300, 1484));
    const { w, h } = spread(placed);

    expect(placed).toHaveLength(117);
    expect(isDegenerateShape(w, h)).toBe(false);
  });

  test("keeps the order it was given, which is what keeps relatives adjacent", () => {
    const placed = shelfPack(boxes(20, 300, 200));

    expect(placed.map((b) => b.name)).toEqual(
      boxes(20, 300, 200).map((b) => b.name),
    );
  });

  test("never overlaps two boxes in the same row", () => {
    const placed = shelfPack(boxes(12, 300, 200));
    const rows = new Map<number, typeof placed>();
    placed.forEach((box) => {
      rows.set(box.y, [...(rows.get(box.y) ?? []), box]);
    });

    for (const row of rows.values()) {
      const sorted = [...row].sort((a, b) => a.x - b.x);
      sorted.slice(1).forEach((box, i) => {
        expect(box.x).toBeGreaterThanOrEqual(sorted[i].x + sorted[i].w);
      });
    }
  });

  test("gives a table wider than the target a row of its own rather than looping", () => {
    const placed = shelfPack([
      { name: "wide", w: 100000, h: 100 },
      { name: "small", w: 100, h: 100 },
    ]);

    expect(placed).toHaveLength(2);
    expect(placed[0]).toMatchObject({ x: 0, y: 0 });
    // The next table starts a fresh row rather than trailing off the edge.
    expect(placed[1].x).toBe(0);
    expect(placed[1].y).toBeGreaterThan(0);
  });
});
