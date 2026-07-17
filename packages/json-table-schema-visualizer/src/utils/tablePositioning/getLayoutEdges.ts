import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";

// The layout edges for dagre: only edges between two REAL table nodes, no
// self-loops. Refs to a table outside the schema (or a self-ref) must not be
// fed to dagre — a phantom/self node skews the layout.
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
