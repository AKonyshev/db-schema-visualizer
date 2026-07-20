import { SHORTCUTS } from "@/constants/shortcuts";

export interface ShortcutEventLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  target: { tagName?: string; isContentEditable?: boolean } | null;
}

const isTypingTarget = (target: ShortcutEventLike["target"]): boolean => {
  if (target == null) {
    return false;
  }
  const tag = target.tagName?.toUpperCase();
  return (
    tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable === true
  );
};

export const matchShortcut = (event: ShortcutEventLike): string | null => {
  // shift намеренно не блокируется: '?' набирается как Shift+/.
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return null;
  }
  if (isTypingTarget(event.target)) {
    return null;
  }

  const key = event.key.toLowerCase();
  const entry = SHORTCUTS.find(
    (shortcut) => shortcut.executable && shortcut.key.toLowerCase() === key,
  );

  return entry?.id ?? null;
};
