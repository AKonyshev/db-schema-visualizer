import { useEffect, useState } from "react";

import { tableRelationsVisibilityStore } from "@/stores/tableRelationsVisibilityStore";
import eventEmitter from "@/events-emitter";

const RELATIONS_TOGGLE_EVENT = "on:table:relations:toggle";

export function useTableRelationsVisibility(tableName: string): {
  isHidden: boolean;
  toggle: () => void;
} {
  const [isHidden, setIsHidden] = useState(() =>
    tableRelationsVisibilityStore.areTableRelationsHidden(tableName),
  );

  useEffect(() => {
    const sync = (): void => {
      setIsHidden(
        tableRelationsVisibilityStore.areTableRelationsHidden(tableName),
      );
    };
    // Resync after Connections has called store.switchTo(documentKey) on mount
    // (Connections renders before the tables, so its effect runs first), so a
    // persisted-hidden table reflects correctly on first load.
    sync();
    eventEmitter.on(RELATIONS_TOGGLE_EVENT, sync);
    return () => {
      eventEmitter.off(RELATIONS_TOGGLE_EVENT, sync);
    };
  }, [tableName]);

  const toggle = (): void => {
    tableRelationsVisibilityStore.toggleTableRelations(tableName);
    eventEmitter.emit(RELATIONS_TOGGLE_EVENT, tableName);
    setIsHidden(
      tableRelationsVisibilityStore.areTableRelationsHidden(tableName),
    );
  };

  return { isHidden, toggle };
}
