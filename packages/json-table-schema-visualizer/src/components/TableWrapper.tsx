import { type JSONTableTable } from "shared/types/tableSchema";

import Table from "./Table";

import { useGetTableMinWidth } from "@/hooks/table";
import TableDimensionProvider from "@/providers/TableDimension";

interface TableWrapperProps {
  table: JSONTableTable;
  /** Passed straight through to `Table`; see the prop there. */
  schemaColumns: number;
}

const TableWrapper = ({ table, schemaColumns }: TableWrapperProps) => {
  const width = useGetTableMinWidth(table);

  return (
    <TableDimensionProvider width={width}>
      <Table {...table} schemaColumns={schemaColumns} />
    </TableDimensionProvider>
  );
};

export default TableWrapper;
