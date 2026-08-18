import { compteSymbolOffset } from "../getRelationSymbol";

import { Position, type XYPosition } from "@/types/positions";

interface GetOrthogonalPathParams {
  source: XYPosition;
  target: XYPosition;
  sourcePosition?: Position;
  targetPosition?: Position;
  /** How far a line runs straight out of a table before it may turn. */
  stub?: number;
  /** Corner radius. Zero draws square corners. */
  radius?: number;
}

const DEFAULT_STUB = 24;
const DEFAULT_RADIUS = 12;

const directionOf = (position: Position): -1 | 1 =>
  position === Position.Left ? -1 : 1;

/**
 * The corners a line turns, from one table's edge to another's.
 *
 * Three shapes cover every case, because a relation only ever attaches to a
 * left or a right edge: out one side and in the other, which turns twice around
 * a vertical corridor between them; or out of two edges facing the same way,
 * which reaches around past the further of the two.
 */
export const orthogonalPoints = (
  from: XYPosition,
  fromDirection: -1 | 1,
  to: XYPosition,
  toDirection: -1 | 1,
  stub: number,
): XYPosition[] => {
  const start = { x: from.x + fromDirection * stub, y: from.y };
  const end = { x: to.x + toDirection * stub, y: to.y };

  if (from.y === to.y) {
    return [from, start, end, to];
  }

  // Facing each other: the corridor goes between them.
  const facing =
    (fromDirection === 1 && toDirection === -1 && start.x <= end.x) ||
    (fromDirection === -1 && toDirection === 1 && start.x >= end.x);

  if (facing) {
    const corridorX = (start.x + end.x) / 2;

    return [
      from,
      start,
      { x: corridorX, y: from.y },
      { x: corridorX, y: to.y },
      end,
      to,
    ];
  }

  // Facing the same way, or overlapping: reach around past whichever edge is
  // further out, so the line never runs back through a table.
  const corridorX =
    fromDirection === -1 ? Math.min(start.x, end.x) : Math.max(start.x, end.x);

  return [from, { x: corridorX, y: from.y }, { x: corridorX, y: to.y }, to];
};

/**
 * An SVG path through `points`, with the corners rounded.
 *
 * A radius is clamped to half of the shorter of the two segments meeting at a
 * corner, so a short segment bends rather than overshooting into the next one.
 */
export const roundedPolyline = (
  points: XYPosition[],
  radius: number,
): string => {
  if (points.length === 0) {
    return "";
  }

  if (points.length < 3 || radius <= 0) {
    return points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
      .join(" ");
  }

  const parts = [`M${points[0].x},${points[0].y}`];

  for (let i = 1; i < points.length - 1; i++) {
    const previous = points[i - 1];
    const corner = points[i];
    const next = points[i + 1];

    const inLength = Math.hypot(corner.x - previous.x, corner.y - previous.y);
    const outLength = Math.hypot(next.x - corner.x, next.y - corner.y);
    const r = Math.min(radius, inLength / 2, outLength / 2);

    if (r <= 0) {
      parts.push(`L${corner.x},${corner.y}`);
      continue;
    }

    const before = {
      x: corner.x + ((previous.x - corner.x) / inLength) * r,
      y: corner.y + ((previous.y - corner.y) / inLength) * r,
    };
    const after = {
      x: corner.x + ((next.x - corner.x) / outLength) * r,
      y: corner.y + ((next.y - corner.y) / outLength) * r,
    };

    parts.push(`L${before.x},${before.y}`);
    parts.push(`Q${corner.x},${corner.y} ${after.x},${after.y}`);
  }

  const last = points[points.length - 1];
  parts.push(`L${last.x},${last.y}`);

  return parts.join(" ");
};

/**
 * A relation drawn as right angles rather than as a curve.
 *
 * On a small schema a curve is prettier. On a large one it is the difference
 * between a diagram and a bowl of spaghetti: a line that runs in straight
 * corridors and turns squarely can be followed by eye across the canvas, where
 * ninety diagonals of varying curvature cannot. The crossings do not go away —
 * measurement says they cannot, on a graph shaped like this one — but a crossing
 * you can read through stops being a problem.
 */
export const getOrthogonalPath = ({
  source,
  sourcePosition = Position.Right,
  target,
  targetPosition = Position.Left,
  stub = DEFAULT_STUB,
  radius = DEFAULT_RADIUS,
}: GetOrthogonalPathParams): string => {
  // The symbol tip, not the table edge, is where the line proper begins — the
  // cardinality glyph lives in between.
  const sourceOffset = compteSymbolOffset(sourcePosition, source);
  const targetOffset = compteSymbolOffset(targetPosition, target);

  const points = orthogonalPoints(
    sourceOffset,
    directionOf(sourcePosition),
    targetOffset,
    directionOf(targetPosition),
    stub,
  );

  const middle = roundedPolyline(points, radius);

  return `M${source.x},${source.y} L${sourceOffset.x},${sourceOffset.y} ${middle} L${target.x},${target.y}`;
};
