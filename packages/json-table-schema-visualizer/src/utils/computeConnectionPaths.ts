import { getBezierPath } from "./computeEgde/computeBezierEdge";
import { getOrthogonalPath } from "./computeEgde/computeOrthogonalEdge";
import { getRelationSymbol } from "./getRelationSymbol";

import { type Position, type XYPosition } from "@/types/positions";
import { DEFAULT_RELATION_STYLE, RelationStyle } from "@/types/relationStyle";

interface LineProps {
  sourceXY: XYPosition;
  sourcePosition: Position;
  targetXY: XYPosition;
  targetPosition: Position;
  style?: RelationStyle;
}

// The line without cardinality symbols: needed for the animated overlay, where
// the dashes must not tear the relation symbols apart.
//
// Right angles or a curve, as the reader chose. The curve is the prettier of
// the two and reads well while there are few relations; past a few dozen it is
// the difference between a diagram and a bowl of spaghetti, because a line that
// runs in corridors and turns squarely can be followed by eye and ninety
// diagonals cannot. Curves are the default because most schemas are the small
// case, and the choice is offered rather than assumed.
//
// Only one of the two is routed. A right angle goes round what stands between
// its ends; a curve takes the direct line and passes under it. Which is why the
// arrangement auto-arrange produces depends on which of them will be drawn.
export const computeConnectionLinePath = ({
  sourceXY,
  sourcePosition,
  targetXY,
  targetPosition,
  style = DEFAULT_RELATION_STYLE,
}: LineProps): string => {
  const geometry = {
    sourcePosition,
    targetPosition,
    source: sourceXY,
    target: targetXY,
  };

  return style === RelationStyle.Bezier
    ? getBezierPath(geometry)
    : getOrthogonalPath(geometry);
};

interface Props extends LineProps {
  relationSource: string;
  relationTarget: string;
}

export interface ConnectionPaths {
  /** The bezier line alone — safe to dash without tearing the symbols. */
  line: string;
  /** The same line followed by both cardinality symbols, as one path string. */
  withSymbols: string;
}

// Both forms in one pass. A caller that renders the connection AND its animated
// overlay needs both, and asking for them separately would run the bezier twice
// per render — `withSymbols` is built from the very `line` returned here, so the
// two can never disagree either.
export const computeConnectionPaths = ({
  relationSource,
  relationTarget,
  sourceXY,
  targetXY,
  sourcePosition,
  targetPosition,
  style,
}: Props): ConnectionPaths => {
  const line = computeConnectionLinePath({
    sourceXY,
    sourcePosition,
    targetXY,
    targetPosition,
    style,
  });

  const sourceSymbolPath = getRelationSymbol(
    relationSource,
    sourcePosition,
    sourceXY,
  );
  const targetSymbolPath = getRelationSymbol(
    relationTarget,
    targetPosition,
    targetXY,
  );

  return {
    line,
    withSymbols: `${line} ${sourceSymbolPath} ${targetSymbolPath}`,
  };
};

export const computeConnectionPathWithSymbols = (props: Props): string =>
  computeConnectionPaths(props).withSymbols;
