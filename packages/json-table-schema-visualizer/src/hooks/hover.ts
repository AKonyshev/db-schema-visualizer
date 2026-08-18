import { useCallback, useSyncExternalStore } from "react";

import { hoverStore } from "@/stores/hoverStore";
import { shouldHighLightCol } from "@/utils/shouldHighLightCol";

/**
 * Subscribe to a slice of the hover state.
 *
 * The selector must return a primitive: `useSyncExternalStore` compares
 * snapshots by identity, so a fresh object would re-render on every pointer move
 * and defeat the whole point.
 */
const useHoverSlice = <T extends string | boolean | null>(select: () => T): T =>
  useSyncExternalStore(hoverStore.subscribe, select, select);

export const useHoveredTableName = (): string | null =>
  useHoverSlice(hoverStore.getHoveredTableName);

export const useIsTableHovered = (tableName: string): boolean =>
  useHoverSlice(
    useCallback(
      () => hoverStore.getHoveredTableName() === tableName,
      [tableName],
    ),
  );

/** True while either end of a relation is under the pointer. */
export const useIsEitherTableHovered = (
  sourceTableName: string,
  targetTableName: string,
): boolean =>
  useHoverSlice(
    useCallback(() => {
      const hovered = hoverStore.getHoveredTableName();

      return hovered === sourceTableName || hovered === targetTableName;
    }, [sourceTableName, targetTableName]),
  );

interface ColumnHighlightArgs {
  tableName: string;
  columnName: string;
  relationalTables?: string[] | null;
}

/**
 * Whether a column should be painted as highlighted, as one boolean.
 *
 * Deriving it inside the selector is what keeps a hover from re-rendering every
 * column in the diagram: only the columns whose answer actually changes hear
 * about it.
 */
export const useIsColumnHighlighted = ({
  tableName,
  columnName,
  relationalTables,
}: ColumnHighlightArgs): boolean =>
  useHoverSlice(
    useCallback(
      () =>
        shouldHighLightCol(
          false,
          tableName,
          hoverStore.getHoveredTableName(),
          hoverStore.getHighlightedColumns(),
          columnName,
          relationalTables,
        ),
      [tableName, columnName, relationalTables],
    ),
  );
