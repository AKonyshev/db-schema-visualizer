import { layoutAroundHubs, type LayoutBox } from "../hubLayout";

import { computeConnectionHandlePos } from "@/utils/computeConnectionHandlePositions";
import { computeConnectionLinePath } from "@/utils/computeConnectionPaths";
import { RelationStyle } from "@/types/relationStyle";

/**
 * What auto-arrange is actually for, measured rather than asserted.
 *
 * Tables are drawn on the layer above relations, so a line that passes under
 * one is not a line the reader can follow — it is simply gone. Right angles are
 * routed around what is in the way; a curve takes the direct line between its
 * ends and passes through it. That difference is the layout's problem, not the
 * renderer's, which is why the arrangement depends on which is to be drawn.
 *
 * This walks every relation the arrangement produced, samples it, and counts
 * the share of its length that lands inside some table other than the two it
 * joins.
 */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const SAMPLES_PER_SEGMENT = 24;

const cubicAt = (
  from: number[],
  c1: number[],
  c2: number[],
  to: number[],
  t: number,
): number[] => {
  const u = 1 - t;

  return [0, 1].map(
    (i) =>
      u * u * u * from[i] +
      3 * u * u * t * c1[i] +
      3 * u * t * t * c2[i] +
      t * t * t * to[i],
  );
};

const quadraticAt = (
  from: number[],
  control: number[],
  to: number[],
  t: number,
): number[] => {
  const u = 1 - t;

  return [0, 1].map(
    (i) => u * u * from[i] + 2 * u * t * control[i] + t * t * to[i],
  );
};

/** Points along a path string, whichever of the two styles drew it. */
const samplePath = (path: string): number[][] => {
  const points: number[][] = [];
  let cursor = [0, 0];

  (path.match(/[MLCQ][^MLCQ]*/g) ?? []).forEach((token) => {
    const n = (token.slice(1).match(/-?[\d.]+/g) ?? []).map(Number);

    if (token[0] === "M" || token[0] === "L") {
      cursor = [n[0], n[1]];
      points.push(cursor);

      return;
    }

    if (token[0] === "C") {
      const to = [n[4], n[5]];
      for (let i = 1; i <= SAMPLES_PER_SEGMENT; i++) {
        points.push(
          cubicAt(
            cursor,
            [n[0], n[1]],
            [n[2], n[3]],
            to,
            i / SAMPLES_PER_SEGMENT,
          ),
        );
      }
      cursor = to;

      return;
    }

    const to = [n[2], n[3]];
    for (let i = 1; i <= SAMPLES_PER_SEGMENT; i++) {
      points.push(
        quadraticAt(cursor, [n[0], n[1]], to, i / SAMPLES_PER_SEGMENT),
      );
    }
    cursor = to;
  });

  return points;
};

const covers = (point: number[], rect: Rect): boolean =>
  point[0] > rect.x + 1 &&
  point[0] < rect.x + rect.w - 1 &&
  point[1] > rect.y + 1 &&
  point[1] < rect.y + rect.h - 1;

/** A hub with two levels of children, same-level links and long-range ones. */
const schema = (): { boxes: LayoutBox[]; edges: Array<[string, string]> } => {
  const boxes: LayoutBox[] = [{ name: "hub", w: 420, h: 700 }];
  const edges: Array<[string, string]> = [];

  for (let i = 0; i < 14; i++) {
    boxes.push({
      name: `a${i}`,
      w: 400 + (i % 3) * 40,
      h: 380 + (i % 5) * 220,
    });
    edges.push(["hub", `a${i}`]);
  }
  for (let i = 0; i < 14; i++) {
    boxes.push({
      name: `b${i}`,
      w: 380 + (i % 4) * 30,
      h: 300 + (i % 6) * 180,
    });
    edges.push([`a${i}`, `b${i}`]);
  }
  for (let i = 0; i + 3 < 14; i += 3) {
    edges.push([`a${i}`, `a${i + 3}`]);
  }
  for (let i = 0; i + 5 < 14; i += 5) {
    edges.push([`b${i}`, `a${i + 5}`]);
  }

  return { boxes, edges };
};

const hiddenShare = (style: RelationStyle): number => {
  const { boxes, edges } = schema();
  const placed = layoutAroundHubs(boxes, edges, undefined, style);
  const rects = new Map<string, Rect>(
    placed.map((b) => [b.name, { x: b.x, y: b.y, w: b.w, h: b.h }]),
  );

  let sampled = 0;
  let hidden = 0;

  edges.forEach(([source, target]) => {
    const from = rects.get(source);
    const to = rects.get(target);
    if (from === undefined || to === undefined) {
      return;
    }

    const [fromSide, toSide, fromX, toX] = computeConnectionHandlePos({
      sourceX: from.x,
      sourceW: from.w,
      targetX: to.x,
      targetW: to.w,
    });

    samplePath(
      computeConnectionLinePath({
        sourceXY: { x: fromX, y: from.y + from.h / 2 },
        sourcePosition: fromSide,
        targetXY: { x: toX, y: to.y + to.h / 2 },
        targetPosition: toSide,
        style,
      }),
    ).forEach((point) => {
      sampled++;
      for (const [name, rect] of rects) {
        if (name !== source && name !== target && covers(point, rect)) {
          hidden++;

          return;
        }
      }
    });
  });

  return hidden / sampled;
};

describe("what auto-arrange leaves visible", () => {
  // The bug this guards: curves were given the tighter arrangement of the two,
  // on the assumption that a curve sweeps through whatever space there is. It
  // does — including the space a table is standing in. A quarter of every
  // relation was drawn underneath one.
  test("curves are no more hidden than right angles", () => {
    expect(hiddenShare(RelationStyle.Bezier)).toBeLessThanOrEqual(
      hiddenShare(RelationStyle.Orthogonal),
    );
  });

  // A floor, not a target. Today this schema measures 8% for curves and 10%
  // for right angles; the bug it is here to catch drew a quarter of every
  // relation underneath a table. Set close to either of today's numbers it
  // would be a tripwire for ordinary drift instead of a guard against that.
  test.each([RelationStyle.Bezier, RelationStyle.Orthogonal])(
    "most of a relation can be followed (%s)",
    (style) => {
      expect(hiddenShare(style)).toBeLessThan(0.15);
    },
  );
});
