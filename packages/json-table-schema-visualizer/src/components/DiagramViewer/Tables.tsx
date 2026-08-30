import { useMemo } from "react";
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

  // Every column in the schema, not in the tables on screen: whether the rows
  // are affordable to draw is a question about the whole drawing, and the
  // answer must not change as the reader pans a cheap corner of an expensive
  // schema into view.
  const schemaColumns = useMemo(
    () => tables.reduce((total, table) => total + table.fields.length, 0),
    [tables],
  );

  return visible.map((table) => (
    <TableWrapper
      key={table.name}
      table={table}
      schemaColumns={schemaColumns}
    />
  ));
};

export default Tables;
