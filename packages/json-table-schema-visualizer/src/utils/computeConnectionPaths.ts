import { getOrthogonalPath } from "./computeEgde/computeOrthogonalEdge";
import { getRelationSymbol } from "./getRelationSymbol";

import { type Position, type XYPosition } from "@/types/positions";

interface LineProps {
  sourceXY: XYPosition;
  sourcePosition: Position;
  targetXY: XYPosition;
  targetPosition: Position;
}

// The line without cardinality symbols: needed for the animated overlay, where
// the dashes must not tear the relation symbols apart.
//
// Right angles rather than a curve. On a small schema the curve was prettier;
// on a large one it is the difference between a diagram and a bowl of
// spaghetti, because a line that runs in corridors and turns squarely can be
// followed by eye and ninety diagonals cannot.
export const computeConnectionLinePath = ({
  sourceXY,
  sourcePosition,
  targetXY,
  targetPosition,
}: LineProps): string =>
  getOrthogonalPath({
    sourcePosition,
    targetPosition,
    source: sourceXY,
    target: targetXY,
  });

interface Props {
  sourceXY: XYPosition;
  sourcePosition: Position;
  targetXY: XYPosition;
  targetPosition: Position;
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
}: Props): ConnectionPaths => {
  const line = computeConnectionLinePath({
    sourceXY,
    sourcePosition,
    targetXY,
    targetPosition,
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
