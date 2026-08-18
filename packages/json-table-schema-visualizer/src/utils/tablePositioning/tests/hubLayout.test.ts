import {
  gapsFor,
  layoutAroundHubs,
  type LayoutBox,
  type PlacedBox,
} from "../hubLayout";

import { TABLES_GAP_X, TABLES_GAP_Y } from "@/constants/sizing";

const box = (name: string, w = 300, h = 200): LayoutBox => ({ name, w, h });

const at = (placed: PlacedBox[], name: string): PlacedBox => {
  const found = placed.find((b) => b.name === name);
  if (found === undefined) {
    throw new Error(`${name} was not placed`);
  }

  return found;
};

const bounds = (
  placed: PlacedBox[],
): { w: number; h: number; bottom: number } => {
  const right = Math.max(...placed.map((b) => b.x + b.w));
  const left = Math.min(...placed.map((b) => b.x));
  const bottom = Math.max(...placed.map((b) => b.y + b.h));
  const top = Math.min(...placed.map((b) => b.y));

  return { w: right - left, h: bottom - top, bottom };
};

const overlaps = (a: PlacedBox, b: PlacedBox): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

describe("layoutAroundHubs", () => {
  test("places nothing for nothing", () => {
    expect(layoutAroundHubs([], [])).toEqual([]);
  });

  test("puts the busiest table between its relations", () => {
    const boxes = ["hub", "a", "b", "c", "d"].map((n) => box(n));
    const edges: Array<[string, string]> = [
      ["hub", "a"],
      ["hub", "b"],
      ["hub", "c"],
      ["hub", "d"],
    ];

    const placed = layoutAroundHubs(boxes, edges);
    const hub = at(placed, "hub");
    const centre = hub.x + hub.w / 2;
    const others = ["a", "b", "c", "d"].map((n) => at(placed, n));

    // Some to the left of the hub, some to the right: a fan, not a column.
    expect(others.some((b) => b.x + b.w <= centre)).toBe(true);
    expect(others.some((b) => b.x >= centre)).toBe(true);
  });

  test("puts second-order relations beyond the first", () => {
    const boxes = ["hub", "child", "grandchild", "other"].map((n) => box(n));
    const placed = layoutAroundHubs(boxes, [
      ["hub", "child"],
      ["hub", "other"],
      ["child", "grandchild"],
    ]);

    const hub = at(placed, "hub");
    const child = at(placed, "child");
    const grandchild = at(placed, "grandchild");

    const childDistance = Math.abs(child.x - hub.x);
    const grandchildDistance = Math.abs(grandchild.x - hub.x);

    expect(grandchildDistance).toBeGreaterThan(childDistance);
    // And it stayed on its parent's side rather than crossing the hub.
    expect(Math.sign(child.x - hub.x)).toBe(Math.sign(grandchild.x - hub.x));
  });

  test("gathers tables with no relations underneath the rest", () => {
    const boxes = ["hub", "a", "b", "lonely1", "lonely2"].map((n) => box(n));
    const placed = layoutAroundHubs(boxes, [
      ["hub", "a"],
      ["hub", "b"],
    ]);

    const related = ["hub", "a", "b"].map((n) => at(placed, n));
    const relatedBottom = Math.max(...related.map((b) => b.y + b.h));

    expect(at(placed, "lonely1").y).toBeGreaterThanOrEqual(relatedBottom);
    expect(at(placed, "lonely2").y).toBeGreaterThanOrEqual(relatedBottom);
  });

  test("lays unrelated tables in rows, not one long column", () => {
    const boxes = Array.from({ length: 24 }, (_, i) => box(`t${i}`));
    const placed = layoutAroundHubs(boxes, []);
    const rows = new Set(placed.map((b) => b.y));

    expect(rows.size).toBeGreaterThan(1);
    expect(rows.size).toBeLessThan(placed.length);
  });

  test("keeps a big schema roughly the shape of a screen", () => {
    // 117 tables averaging 48 columns, as the real one does.
    const boxes = Array.from({ length: 117 }, (_, i) =>
      box(`t${i}`, 300, 1484),
    );
    const edges: Array<[string, string]> = Array.from(
      { length: 70 },
      (_, i) => ["t0", `t${i + 1}`],
    );

    const { w, h } = bounds(layoutAroundHubs(boxes, edges));
    const aspect = w / h;

    expect(aspect).toBeGreaterThan(0.4);
    expect(aspect).toBeLessThan(4);
  });

  test("never overlaps two tables", () => {
    const boxes = Array.from({ length: 30 }, (_, i) =>
      box(`t${i}`, 200 + (i % 4) * 60, 150 + (i % 5) * 90),
    );
    const edges: Array<[string, string]> = Array.from(
      { length: 18 },
      (_, i) => [i % 3 === 0 ? "t0" : `t${i}`, `t${i + 1}`],
    );

    const placed = layoutAroundHubs(boxes, edges);

    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        expect(overlaps(placed[i], placed[j])).toBe(false);
      }
    }
  });

  test("ignores an edge naming a table it was not given", () => {
    const placed = layoutAroundHubs(
      [box("a"), box("b")],
      [
        ["a", "ghost"],
        ["a", "b"],
      ],
    );

    expect(placed).toHaveLength(2);
  });
});

describe("gapsFor", () => {
  test("leaves a fixed minimum for small tables", () => {
    const gaps = gapsFor([
      { name: "a", w: 40, h: 40 },
      { name: "b", w: 40, h: 40 },
    ]);

    expect(gaps.x).toBe(TABLES_GAP_X);
    expect(gaps.y).toBe(TABLES_GAP_Y);
  });

  // At full detail a table is around 450 wide and over a thousand tall; a fixed
  // 50px between them left the relation lines nowhere to be seen going.
  test("opens up once the tables are large", () => {
    const gaps = gapsFor([
      { name: "a", w: 450, h: 1340 },
      { name: "b", w: 450, h: 1340 },
    ]);

    expect(gaps.x).toBeGreaterThan(TABLES_GAP_X * 3);
    expect(gaps.y).toBeGreaterThan(TABLES_GAP_Y * 3);
  });

  test("has something to say about no tables at all", () => {
    expect(gapsFor([])).toEqual({ x: TABLES_GAP_X, y: TABLES_GAP_Y });
  });
});
