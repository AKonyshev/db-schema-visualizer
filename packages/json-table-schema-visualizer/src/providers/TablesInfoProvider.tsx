import { createContext, useMemo, useState, type ReactNode } from "react";

import type { TablesInfoProviderValue } from "@/types/tablesInfoProviderValue";
import type { JSONTableTable } from "shared/types/tableSchema";

import { computeColIndexes } from "@/utils/computeColIndexes";
import { useTableDetailLevel } from "@/hooks/tableDetailLevel";

export const TablesInfoContext = createContext<
  TablesInfoProviderValue | undefined
>(undefined);

interface TablesInfoProviderProps {
  tables: JSONTableTable[];
  children: ReactNode;
}

const TablesInfoProvider = ({ children, tables }: TablesInfoProviderProps) => {
  const [hoveredTableName, setHoveredTableName] = useState<string | null>(null);
  const [highlightedColumns, setHighlightedColumns] = useState<string[]>([]);
  const { detailLevel } = useTableDetailLevel();

  // The column map depends on the schema and the detail level, and on nothing
  // else — least of all on what the pointer is over. Recomputed inline it was
  // rebuilt on every hover: ~100 ms per mouse move on a 5,676-column schema.
  const colsIndexes = useMemo(
    () => computeColIndexes(tables, detailLevel),
    [tables, detailLevel],
  );

  // A fresh object here re-renders every consumer — all 117 table headers and 93
  // connections — whenever anything in the provider changes.
  const value = useMemo(
    () => ({
      colsIndexes,
      hoveredTableName,
      setHoveredTableName,
      highlightedColumns,
      setHighlightedColumns,
    }),
    [colsIndexes, hoveredTableName, highlightedColumns],
  );

  return (
    <TablesInfoContext.Provider value={value}>
      {children}
    </TablesInfoContext.Provider>
  );
};

export default TablesInfoProvider;
