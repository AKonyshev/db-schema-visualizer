import { type JSONTableTable } from "shared/types/tableSchema";

import TableWrapper from "../TableWrapper";

import { useVisibleTables } from "@/hooks/viewport";

interface TablesProps {
  tables: JSONTableTable[];
}

const Tables = ({ tables }: TablesProps) => {
  // Only what the reader can see, plus half a viewport of margin. Off-screen
  // tables keep their coordinates in the store, so the connections that reach
  // them still know where to point.
  const visible = useVisibleTables(tables);

  return visible.map((table) => (
    <TableWrapper key={table.name} table={table} />
  ));
};

export default Tables;
