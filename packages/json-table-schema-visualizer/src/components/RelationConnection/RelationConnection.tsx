import { useMemo } from "react";

import ConnectionPath from "./ConnectionPath";

import type { RelationItem } from "@/types/relation";

import { useRelationsCoords } from "@/hooks/relationConnection";
import { computeConnectionPaths } from "@/utils/computeConnectionPaths";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import useLocalStorage from "@/hooks/localStorage";
import {
  DEFAULT_RELATION_STYLE,
  type RelationStyle,
} from "@/types/relationStyle";

interface RelationConnectionProps {
  source: RelationItem;
  target: RelationItem;
}

const RelationConnection = ({ source, target }: RelationConnectionProps) => {
  const { sourcePosition, sourceXY, targetPosition, targetXY } =
    useRelationsCoords(source, target);

  const { x: sourceX, y: sourceY } = sourceXY;
  const { x: targetX, y: targetY } = targetXY;
  const [style] = useLocalStorage<RelationStyle>(
    STORAGE_KEYS.RELATION_STYLE,
    DEFAULT_RELATION_STYLE,
  );

  // One memo, not two: the connection and its animated overlay share the same
  // path, so computing them apart would run it twice on every render.
  const { line, withSymbols } = useMemo(() => {
    return computeConnectionPaths({
      targetXY,
      sourceXY,
      sourcePosition,
      targetPosition,
      relationSource: source.relation,
      relationTarget: target.relation,
      style,
    });
  }, [
    sourcePosition,
    targetPosition,
    sourceX,
    targetX,
    sourceY,
    targetY,
    style,
  ]);

  const relationOwner =
    source.relation === "1" ? source.tableName : target.tableName;

  return (
    <>
      <ConnectionPath
        path={withSymbols}
        linePath={line}
        sourceTableName={source.tableName}
        targetTableName={target.tableName}
        relationOwner={relationOwner}
        sourceFieldNames={source.fieldNames ?? []}
        targetFieldNames={target.fieldNames ?? []}
      />
    </>
  );
};

export default RelationConnection;
