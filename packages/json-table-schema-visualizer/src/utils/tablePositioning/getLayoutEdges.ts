import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";

// The edges the layout works from: only those between two real tables, and no
// self-loops. A ref to a table outside the schema, or a table to itself, would
// otherwise invent a node or a cycle that skews where everything else lands.
export function getLayoutEdges(
  tables: JSONTableTable[],
  refs: JSONTableRef[],
): Array<[string, string]> {
  const nodeNames = new Set(tables.map((t) => t.name));
  const edges: Array<[string, string]> = [];
  refs.forEach((ref) => {
    const source = ref.endpoints[0].tableName;
    const target = ref.endpoints[1].tableName;
    if (source !== target && nodeNames.has(source) && nodeNames.has(target)) {
      edges.push([source, target]);
    }
  });
  return edges;
}
