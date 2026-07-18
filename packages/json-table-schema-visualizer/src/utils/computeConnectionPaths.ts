import { getBezierPath } from "./computeEgde/computeBezierEdge";
import { getRelationSymbol } from "./getRelationSymbol";

import { type Position, type XYPosition } from "@/types/positions";

interface LineProps {
  sourceXY: XYPosition;
  sourcePosition: Position;
  targetXY: XYPosition;
  targetPosition: Position;
}

// Линия без символов кардинальности: нужна для анимированного оверлея, где
// пунктир не должен разрывать символы связи.
export const computeConnectionLinePath = ({
  sourceXY,
  sourcePosition,
  targetXY,
  targetPosition,
}: LineProps): string =>
  getBezierPath({
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

export const computeConnectionPathWithSymbols = ({
  relationSource,
  relationTarget,
  sourceXY,
  targetXY,
  sourcePosition,
  targetPosition,
}: Props): string => {
  const linePath = computeConnectionLinePath({
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

  return `${linePath} ${sourceSymbolPath} ${targetSymbolPath}`;
};
