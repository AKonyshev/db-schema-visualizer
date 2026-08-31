import { createContext, useMemo, type ReactNode } from "react";
import {
  type JSONTableRef,
  type JSONTableTable,
} from "shared/types/tableSchema";

import { computeForeignKeyFields } from "@/utils/foreignKeys";

export const ForeignKeysContext = createContext<ReadonlySet<string> | null>(
  null,
);

interface ForeignKeysProviderProps {
  tables: JSONTableTable[];
  refs: JSONTableRef[];
  children: ReactNode;
}

/**
 * Which columns carry a foreign key, computed once for the diagram.
 *
 * A column cannot answer this on its own — see `computeForeignKeyFields` — and
 * a table does not hold the relations, so the answer has to arrive from above.
 * A context rather than a prop for the same reason `TablesColorProvider` is
 * one: what needs it is a column, five levels down, and every level between
 * would otherwise carry a prop that means nothing to it.
 */
const ForeignKeysProvider = ({
  tables,
  refs,
  children,
}: ForeignKeysProviderProps) => {
  const foreignKeys = useMemo(
    () => computeForeignKeyFields(tables, refs),
    [tables, refs],
  );

  return (
    <ForeignKeysContext.Provider value={foreignKeys}>
      {children}
    </ForeignKeysContext.Provider>
  );
};

export default ForeignKeysProvider;
