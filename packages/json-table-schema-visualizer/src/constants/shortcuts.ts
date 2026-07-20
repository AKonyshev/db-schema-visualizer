import { type MessageKey } from "@/i18n/messages";

export interface ShortcutEntry {
  id: string;
  /** `event.key` value for executable entries; display text for reference rows. */
  key: string;
  labelKey: MessageKey;
  /** false — a legend-only row; its logic lives elsewhere. */
  executable: boolean;
}

// The single source of truth: both the key handler and the legend are derived
// from it, so the legend cannot drift from what actually fires.
export const SHORTCUTS = [
  {
    id: "colorRelations",
    key: "c",
    labelKey: "action.colorRelations",
    executable: true,
  },
  {
    id: "animateRelations",
    key: "a",
    labelKey: "action.animateRelations",
    executable: true,
  },
  {
    id: "shortTableName",
    key: "s",
    labelKey: "action.shortTableName",
    executable: true,
  },
  {
    id: "detailLevel",
    key: "d",
    labelKey: "action.detailLevel",
    executable: true,
  },
  {
    id: "autoArrange",
    key: "l",
    labelKey: "action.autoArrange",
    executable: true,
  },
  {
    id: "fitToView",
    key: "f",
    labelKey: "action.fitToView",
    executable: true,
  },
  {
    id: "legend",
    key: "?",
    labelKey: "action.showLegend",
    executable: true,
  },
  {
    id: "closeLegend",
    key: "Esc",
    labelKey: "action.closeLegend",
    executable: false,
  },
  {
    id: "search",
    key: "Ctrl/Cmd+F",
    labelKey: "action.search",
    executable: false,
  },
  {
    id: "toggleRefs",
    key: "Alt+H",
    labelKey: "action.toggleRefs",
    executable: false,
  },
] as const satisfies readonly ShortcutEntry[];

export type ExecutableShortcutId = Extract<
  (typeof SHORTCUTS)[number],
  { executable: true }
>["id"];
