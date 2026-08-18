import { TABLES_GAP_X, TABLES_GAP_Y } from "@/constants/sizing";
import { DEFAULT_RELATION_STYLE, RelationStyle } from "@/types/relationStyle";

export interface LayoutBox {
  name: string;
  w: number;
  h: number;
}

export interface PlacedBox extends LayoutBox {
  x: number;
  y: number;
}

/**
 * The shape auto-arrange aims the whole diagram at.
 *
 * A wider target does fit a screen better, and it was tried: on a real
 * eighteen-table schema, three halves scaled to 0.271 against five quarters'
 * 0.241. It was not kept. The same change put a fifth of every relation
 * underneath a table — 10% to 18% for right angles, 8% to 12% for curves —
 * because a wider budget packs the columns closer together, and a diagram
 * whose relations cannot be followed is not one worth fitting on a screen.
 */
export const TARGET_ASPECT = 5 / 4;

interface Group {
  boxes: LayoutBox[];
  side: -1 | 1;
  level: number;
}

interface Gaps {
  x: number;
  y: number;
}

/**
 * How much room to leave between tables.
 *
 * A fixed 50px was most of a table when tables were small and a rounding error
 * when they are 450 wide and over a thousand tall — at full detail the diagram
 * became a wall of blocks with the relation lines lost somewhere behind it. The
 * gaps track the tables instead, so there is always somewhere for a line to be
 * seen going.
 *
 * How much room depends on what is drawn in it, and the two styles want it for
 * opposite reasons. Right angles are routed: a line leaves its table, runs down
 * a corridor and turns in, so it needs a corridor wide enough to be told apart
 * from the tables either side, and no more. A curve is not routed at all — it
 * takes the direct line between its ends and passes through whatever stands in
 * the way, and tables are drawn over relations, so anything it passes through
 * hides it.
 *
 * Which means curves need MORE room than right angles, not less. Measured on a
 * hub-and-spoke schema by sampling every relation and counting the length that
 * lands under some other table:
 *
 *   room  0.30  0.50  0.75  1.00  1.50
 *   hidden 25%   20%   14%    8%    4%
 *
 * Right angles sit at 10% on 0.75. One is where curves match them while costing
 * about a tenth more canvas; past that the gain is real but every table is drawn
 * smaller once the result is fitted to the screen, which is its own kind of
 * unreadable.
 */
export const gapsFor = (
  boxes: LayoutBox[],
  style: RelationStyle = DEFAULT_RELATION_STYLE,
): Gaps => {
  if (boxes.length === 0) {
    return { x: TABLES_GAP_X, y: TABLES_GAP_Y };
  }

  const room = style === RelationStyle.Bezier ? 1 : 0.75;

  const median = (values: number[]): number => {
    const sorted = [...values].sort((a, b) => a - b);

    return sorted[Math.floor(sorted.length / 2)];
  };

  return {
    x: Math.max(TABLES_GAP_X, Math.round(median(boxes.map((b) => b.w)) * room)),
    y: Math.max(
      TABLES_GAP_Y,
      Math.round(median(boxes.map((b) => b.h)) * room * 0.27),
    ),
  };
};

const buildAdjacency = (
  names: Set<string>,
  edges: Array<[string, string]>,
): Map<string, Set<string>> => {
  const adjacency = new Map<string, Set<string>>();
  names.forEach((name) => adjacency.set(name, new Set()));

  edges.forEach(([source, target]) => {
    if (source === target || !names.has(source) || !names.has(target)) {
      return;
    }
    adjacency.get(source)?.add(target);
    adjacency.get(target)?.add(source);
  });

  return adjacency;
};

/** Every table reachable from `start`, in the order it was reached. */
const componentFrom = (
  start: string,
  adjacency: Map<string, Set<string>>,
  seen: Set<string>,
): string[] => {
  const component: string[] = [];
  const queue = [start];
  seen.add(start);

  while (queue.length > 0) {
    const name = queue.shift();
    if (name === undefined) {
      break;
    }
    component.push(name);
    (adjacency.get(name) ?? new Set()).forEach((next) => {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    });
  }

  return component;
};

/**
 * Stack boxes in a column, wrapping into further columns once the budget is
 * spent, and return the columns with their widths.
 */
const intoColumns = (
  boxes: LayoutBox[],
  heightBudget: number,
  gaps: Gaps,
): LayoutBox[][] => {
  const columns: LayoutBox[][] = [];
  let column: LayoutBox[] = [];
  let height = 0;

  boxes.forEach((box) => {
    const next = height === 0 ? box.h : height + gaps.y + box.h;
    if (column.length > 0 && next > heightBudget) {
      columns.push(column);
      column = [box];
      height = box.h;
      return;
    }
    column.push(box);
    height = next;
  });

  if (column.length > 0) {
    columns.push(column);
  }

  return columns;
};

const columnHeight = (column: LayoutBox[], gaps: Gaps): number =>
  column.reduce(
    (total, box, index) => total + box.h + (index > 0 ? gaps.y : 0),
    0,
  );

const columnWidth = (column: LayoutBox[]): number =>
  column.reduce((max, box) => Math.max(max, box.w), 0);

/**
 * One connected component, drawn as a hub with its relations either side.
 *
 * The busiest table sits in the middle; everything one relation away from it
 * forms the columns immediately left and right, everything two away the columns
 * beyond those, and so on. Which side a table lands on is decided at the first
 * level, by whichever side is currently shorter, and its own descendants follow
 * it — so a branch stays together instead of being cut in half.
 */
const layoutComponent = (
  names: string[],
  sizeOf: Map<string, LayoutBox>,
  adjacency: Map<string, Set<string>>,
  heightBudget: number,
  gaps: Gaps,
): PlacedBox[] => {
  const hub = names.reduce((best, name) =>
    (adjacency.get(name)?.size ?? 0) > (adjacency.get(best)?.size ?? 0)
      ? name
      : best,
  );

  const groups = new Map<string, Group>();
  const sideOf = new Map<string, -1 | 1>();
  const levelOf = new Map<string, number>([[hub, 0]]);
  const visited = new Set<string>([hub]);

  let queue: string[] = [hub];
  let heightLeft = 0;
  let heightRight = 0;

  while (queue.length > 0) {
    const next: string[] = [];

    queue.forEach((name) => {
      const level = levelOf.get(name) ?? 0;

      (adjacency.get(name) ?? new Set()).forEach((child) => {
        if (visited.has(child)) {
          return;
        }
        visited.add(child);
        levelOf.set(child, level + 1);

        const box = sizeOf.get(child);
        if (box == null) {
          return;
        }

        // The first level is what balances the picture; deeper tables stay on
        // the side of the branch they belong to.
        let side = sideOf.get(name);
        if (side === undefined || level === 0) {
          side = heightRight <= heightLeft ? 1 : -1;
          if (side === 1) {
            heightRight += box.h;
          } else {
            heightLeft += box.h;
          }
        }
        sideOf.set(child, side);

        const key = `${side}:${level + 1}`;
        const group = groups.get(key) ?? { boxes: [], side, level: level + 1 };
        group.boxes.push(box);
        groups.set(key, group);

        next.push(child);
      });
    });

    queue = next;
  }

  const placed: PlacedBox[] = [];
  const hubBox = sizeOf.get(hub);
  if (hubBox == null) {
    return placed;
  }

  placed.push({ ...hubBox, x: -hubBox.w / 2, y: -hubBox.h / 2 });

  ([1, -1] as const).forEach((side) => {
    const levels = [...groups.values()]
      .filter((group) => group.side === side)
      .sort((a, b) => a.level - b.level);

    // Start beyond the hub and walk outwards, one level of columns at a time.
    let edge = hubBox.w / 2 + gaps.x;

    levels.forEach((group) => {
      const columns = intoColumns(group.boxes, heightBudget, gaps);

      columns.forEach((column) => {
        const width = columnWidth(column);
        const x = side === 1 ? edge : -edge - width;
        let y = -columnHeight(column, gaps) / 2;

        column.forEach((box) => {
          placed.push({ ...box, x, y });
          y += box.h + gaps.y;
        });

        edge += width + gaps.x;
      });
    });
  });

  return placed;
};

const boundsOf = (
  placed: PlacedBox[],
): { x: number; y: number; w: number; h: number } => {
  const left = Math.min(...placed.map((box) => box.x));
  const top = Math.min(...placed.map((box) => box.y));
  const right = Math.max(...placed.map((box) => box.x + box.w));
  const bottom = Math.max(...placed.map((box) => box.y + box.h));

  return { x: left, y: top, w: right - left, h: bottom - top };
};

const shift = (placed: PlacedBox[], dx: number, dy: number): PlacedBox[] =>
  placed.map((box) => ({ ...box, x: box.x + dx, y: box.y + dy }));

/** Rows of boxes, wrapping at `width`. */
const intoRows = (
  boxes: LayoutBox[],
  width: number,
  gaps: Gaps,
): PlacedBox[] => {
  const placed: PlacedBox[] = [];
  let x = 0;
  let y = 0;
  let rowHeight = 0;

  boxes.forEach((box) => {
    if (x > 0 && x + box.w > width) {
      x = 0;
      y += rowHeight + gaps.y;
      rowHeight = 0;
    }
    placed.push({ ...box, x, y });
    x += box.w + gaps.x;
    rowHeight = Math.max(rowHeight, box.h);
  });

  return placed;
};

/**
 * Unrelated tables tucked into the space either side of the diagram.
 *
 * The columns beside a hub-and-spoke diagram are free: it is taller than it is
 * wide, nothing has to reach a table with no relations, and nothing is hidden
 * by putting one there. Underneath, the same tables cost their full height —
 * on a real schema of eighteen tables the four unrelated ones were the largest
 * in the file and added 3,767px of it, which fit-to-view answered by halving
 * the scale of everything.
 *
 * What they may not do is make the diagram taller than it already is, so a
 * table is taken only while the side it would join still has room within the
 * diagram's own height. Tallest first, onto whichever side is shorter; the
 * rest fall through to the block underneath, which is where they all used to
 * go.
 */
const besideDiagram = (
  boxes: LayoutBox[],
  height: number,
  gaps: Gaps,
): { left: LayoutBox[]; right: LayoutBox[]; leftover: LayoutBox[] } => {
  const left: LayoutBox[] = [];
  const right: LayoutBox[] = [];
  const leftover: LayoutBox[] = [];
  const used = [0, 0];

  [...boxes]
    .sort((a, b) => b.h - a.h)
    .forEach((box) => {
      const side = used[0] <= used[1] ? 0 : 1;
      const column = side === 0 ? left : right;
      const next = used[side] + (column.length > 0 ? gaps.y : 0) + box.h;

      // The shorter side had no room, so neither has the other one.
      if (next > height) {
        leftover.push(box);

        return;
      }

      column.push(box);
      used[side] = next;
    });

  return { left, right, leftover };
};

/** A column of boxes stacked downward from `y = 0` at the given x. */
const stackAt = (column: LayoutBox[], x: number, gaps: Gaps): PlacedBox[] => {
  let y = 0;

  return column.map((box) => {
    const placed = { ...box, x, y };
    y += box.h + gaps.y;

    return placed;
  });
};

/**
 * Place every table: hubs with their relations around them, and everything with
 * no relations either side of them or, failing that, gathered underneath.
 *
 * A table whose relations the reader has hidden arrives here with no edges, so
 * it is placed as one — which is what "hidden" should mean to a layout.
 */
export const layoutAroundHubs = (
  boxes: LayoutBox[],
  edges: Array<[string, string]>,
  targetAspect: number = TARGET_ASPECT,
  style: RelationStyle = DEFAULT_RELATION_STYLE,
): PlacedBox[] => {
  if (boxes.length === 0) {
    return [];
  }

  const sizeOf = new Map(boxes.map((box) => [box.name, box]));
  const names = new Set(sizeOf.keys());
  const adjacency = buildAdjacency(names, edges);
  const gaps = gapsFor(boxes, style);

  const area = boxes.reduce((total, box) => total + box.w * box.h, 0);
  const widest = boxes.reduce((max, box) => Math.max(max, box.w), 0);
  const tallest = boxes.reduce((max, box) => Math.max(max, box.h), 0);
  // What the block of unrelated tables falls back to when there is no diagram
  // above it to take its width from.
  const targetWidth = Math.max(Math.sqrt(area * targetAspect), widest);

  const connected = boxes.filter(
    (box) => (adjacency.get(box.name)?.size ?? 0) > 0,
  );
  const isolated = boxes.filter(
    (box) => (adjacency.get(box.name)?.size ?? 0) === 0,
  );

  // Components, biggest first, stacked one under another.
  const seen = new Set<string>();
  const components: string[][] = [];
  connected.forEach((box) => {
    if (!seen.has(box.name)) {
      components.push(componentFrom(box.name, adjacency, seen));
    }
  });
  components.sort((a, b) => b.length - a.length);

  const layoutWith = (heightBudget: number): PlacedBox[] => {
    let placed: PlacedBox[] = [];

    // Each component drawn on its own, then the drawings arranged as a group.
    // Stacking them one under another was what made a schema of five small
    // components into a ribbon: none of them was taller than 1,214px and the
    // stack came to 4,485px, all of it height that fit-to-view had to pay for
    // while the space either side went unused.
    const drawings = components
      .map((component) =>
        layoutComponent(component, sizeOf, adjacency, heightBudget, gaps),
      )
      .filter((laid) => laid.length > 0)
      .map((laid) => ({ laid, bounds: boundsOf(laid) }));

    const shelfGaps = { x: gaps.x * 2, y: gaps.y * 2 };
    const shelfWidth = Math.max(
      Math.sqrt(
        drawings.reduce((sum, d) => sum + d.bounds.w * d.bounds.h, 0) *
          targetAspect,
      ),
      ...drawings.map((d) => d.bounds.w),
    );
    const shelves = intoRows(
      drawings.map((d, index) => ({
        name: String(index),
        w: d.bounds.w,
        h: d.bounds.h,
      })),
      shelfWidth,
      shelfGaps,
    );

    shelves.forEach((shelf, index) => {
      const { laid, bounds } = drawings[index];
      placed = placed.concat(
        shift(laid, shelf.x - bounds.x, shelf.y - bounds.y),
      );
    });

    const bottom = placed.length > 0 ? boundsOf(placed).h + gaps.y * 2 : 0;

    let remaining = isolated;

    if (isolated.length > 0 && placed.length > 0) {
      const main = boundsOf(placed);
      const { left, right, leftover } = besideDiagram(isolated, main.h, gaps);
      remaining = leftover;

      if (left.length > 0) {
        const x = main.x - gaps.x - columnWidth(left);
        placed = placed.concat(shift(stackAt(left, x, gaps), 0, main.y));
      }
      if (right.length > 0) {
        const x = main.x + main.w + gaps.x;
        placed = placed.concat(shift(stackAt(right, x, gaps), 0, main.y));
      }
    }

    if (remaining.length > 0) {
      // As wide as the diagram it sits under, so the whole thing reads as one
      // block rather than a wide picture with a long tail beneath it.
      const mainWidth = placed.length > 0 ? boundsOf(placed).w : targetWidth;
      const rows = intoRows(remaining, Math.max(mainWidth, widest), gaps);
      const gap = placed.length > 0 ? gaps.y * 3 : 0;
      placed = placed.concat(shift(rows, 0, bottom + gap));
    }

    const bounds = boundsOf(placed);

    return shift(placed, -bounds.x, -bounds.y);
  };

  // The height a column may use decides the whole shape, but not in a way worth
  // solving on paper: the rows of unrelated tables underneath add height the
  // columns above knew nothing about, and tables differ enough in size that the
  // arithmetic does not close. What is true is that the shape moves one way
  // only — a taller budget means fewer, longer columns, so a narrower diagram —
  // and that is enough to search for the budget that lands nearest the target.
  const totalHeight = boxes.reduce((sum, box) => sum + box.h + gaps.y, 0);
  const aspectOf = (placed: PlacedBox[]): number => {
    const bounds = boundsOf(placed);

    return bounds.h > 0 ? bounds.w / bounds.h : targetAspect;
  };

  // The floor is the tallest table that actually goes into a column, which is
  // not the tallest table there is. Unrelated tables are placed beside the
  // diagram or beneath it and never enter a column, so letting one set the
  // floor stops the columns wrapping at all: on a real schema the largest table
  // was unrelated at 2,744px, the busiest level came to 2,732px, and every
  // target aspect from 1.25 to 6 returned the identical arrangement because no
  // budget the search was allowed to try could split that level in two.
  const tallestConnected = connected.reduce(
    (max, box) => Math.max(max, box.h),
    0,
  );
  const tallestInColumn = tallestConnected > 0 ? tallestConnected : tallest;

  let low = tallestInColumn;
  let high = Math.max(totalHeight, tallest * 2);
  let best = layoutWith(low);
  let bestMiss = Math.abs(Math.log(aspectOf(best) / targetAspect));

  for (let pass = 0; pass < 24 && high - low > tallestInColumn / 4; pass++) {
    const budget = (low + high) / 2;
    const candidate = layoutWith(budget);
    const aspect = aspectOf(candidate);
    const miss = Math.abs(Math.log(aspect / targetAspect));

    if (miss < bestMiss) {
      bestMiss = miss;
      best = candidate;
    }

    if (aspect > targetAspect) {
      // Too wide: the columns need to be allowed to run longer.
      low = budget;
    } else {
      high = budget;
    }
  }

  return best;
};
