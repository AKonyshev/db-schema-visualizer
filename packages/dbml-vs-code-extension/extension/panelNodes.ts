export type PanelNode =
  | { kind: "group"; id: "actions" | "connections"; label: string }
  | { kind: "action"; label: string; commandId: string; icon: string }
  | { kind: "connection"; name: string }
  | { kind: "empty"; label: string };

export const ACTION_NODES: PanelNode[] = [
  {
    kind: "action",
    label: "Show diagram",
    commandId: "dbml-erd-visualizer.previewDiagrams",
    icon: "graph",
  },
  {
    kind: "action",
    label: "Import from database",
    commandId: "dbml-erd-visualizer.importFromDatabase",
    icon: "cloud-download",
  },
  {
    kind: "action",
    label: "Compare with database",
    commandId: "dbml-erd-visualizer.compareWithDatabase",
    icon: "diff",
  },
];

export function buildConnectionNodes(names: string[]): PanelNode[] {
  if (names.length === 0) {
    return [{ kind: "empty", label: "No saved connections" }];
  }
  return names.map((name) => ({ kind: "connection", name }));
}
