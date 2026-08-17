import { createContext, useMemo, type ReactNode } from "react";

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
  const { detailLevel } = useTableDetailLevel();

  // Depends on the schema and the detail level, and on nothing else. Recomputed
  // inline it was rebuilt on every hover: ~100 ms per mouse move on a
  // 5,676-column schema.
  const colsIndexes = useMemo(
    () => computeColIndexes(tables, detailLevel),
    [tables, detailLevel],
  );

  const value = useMemo(() => ({ colsIndexes }), [colsIndexes]);

  return (
    <TablesInfoContext.Provider value={value}>
      {children}
    </TablesInfoContext.Provider>
  );
};

export default TablesInfoProvider;
