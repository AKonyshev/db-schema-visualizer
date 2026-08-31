export type PanelNode =
  | { kind: "group"; id: "actions" | "connections"; label: string }
  | { kind: "action"; label: string; commandId: string; icon: string }
  | { kind: "connection"; name: string }
  | { kind: "empty"; label: string };

// The two top-level groups. They live here rather than inline in the tree
// provider so that every static panel string sits in one model — which is what
// lets one test check them all against the translation bundles.
export const GROUP_NODES: PanelNode[] = [
  { kind: "group", id: "actions", label: "Actions" },
  { kind: "group", id: "connections", label: "Connections" },
];

export const ACTION_NODES: PanelNode[] = [
  {
    kind: "action",
    label: "Show diagram",
    commandId: "dbmlStudio.previewDiagrams",
    icon: "graph",
  },
  {
    kind: "action",
    label: "Import from database",
    commandId: "dbmlStudio.importFromDatabase",
    icon: "cloud-download",
  },
  {
    kind: "action",
    label: "Compare with database",
    commandId: "dbmlStudio.compareWithDatabase",
    icon: "diff",
  },
];

export function buildConnectionNodes(names: string[]): PanelNode[] {
  if (names.length === 0) {
    return [{ kind: "empty", label: "No saved connections" }];
  }
  return names.map((name) => ({ kind: "connection", name }));
}
