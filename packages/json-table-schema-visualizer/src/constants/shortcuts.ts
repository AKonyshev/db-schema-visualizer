export interface ShortcutEntry {
  id: string;
  /** `event.key` value for executable entries; display text for reference rows. */
  key: string;
  label: string;
  /** false — a legend-only row; its logic lives elsewhere. */
  executable: boolean;
}

// The single source of truth: both the key handler and the legend are derived
// from it, so the legend cannot drift from what actually fires.
export const SHORTCUTS = [
  {
    id: "colorRelations",
    key: "c",
    label: "Colored relations",
    executable: true,
  },
  {
    id: "animateRelations",
    key: "a",
    label: "Relation animation",
    executable: true,
  },
  {
    id: "shortTableName",
    key: "s",
    label: "Short table names",
    executable: true,
  },
  {
    id: "detailLevel",
    key: "d",
    label: "Detail level",
    executable: true,
  },
  { id: "autoArrange", key: "l", label: "Auto-arrange", executable: true },
  { id: "fitToView", key: "f", label: "Fit to view", executable: true },
  { id: "legend", key: "?", label: "Show this legend", executable: true },
  {
    id: "closeLegend",
    key: "Esc",
    label: "Close the legend",
    executable: false,
  },
  {
    id: "search",
    key: "Ctrl/Cmd+F",
    label: "Search tables",
    executable: false,
  },
  {
    id: "toggleRefs",
    key: "Alt+H",
    label: "Toggle refs in DBML",
    executable: false,
  },
] as const satisfies readonly ShortcutEntry[];

export type ExecutableShortcutId = Extract<
  (typeof SHORTCUTS)[number],
  { executable: true }
>["id"];
