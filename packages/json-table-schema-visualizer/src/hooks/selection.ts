import { useCallback, useSyncExternalStore } from "react";

import { interactionModeStore } from "@/stores/interactionModeStore";
import { selectionStore } from "@/stores/selectionStore";
import { InteractionMode } from "@/types/interactionMode";

export const useInteractionMode = (): InteractionMode =>
  useSyncExternalStore(
    interactionModeStore.subscribe,
    interactionModeStore.getMode,
    interactionModeStore.getMode,
  );

export const useIsSelectMode = (): boolean =>
  useInteractionMode() === InteractionMode.Select;

/**
 * One boolean per table, which is what keeps a marquee from re-rendering the
 * whole diagram: only the tables whose answer changed hear about it. See
 * `useIsColumnHighlighted` for the same shape.
 */
export const useIsTableSelected = (tableName: string): boolean => {
  const select = useCallback(
    () => selectionStore.isSelected(tableName),
    [tableName],
  );

  return useSyncExternalStore(selectionStore.subscribe, select, select);
};

export const useSelectedTables = (): ReadonlySet<string> =>
  useSyncExternalStore(
    selectionStore.subscribe,
    selectionStore.getSelected,
    selectionStore.getSelected,
  );
