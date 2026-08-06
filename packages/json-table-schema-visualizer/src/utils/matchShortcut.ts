import { SHORTCUTS, type ExecutableShortcutId } from "@/constants/shortcuts";
import { isTypingTarget, type TypingTarget } from "@/utils/isTypingTarget";

export interface ShortcutEventLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  target: TypingTarget | null;
}

export const matchShortcut = (
  event: ShortcutEventLike,
): ExecutableShortcutId | null => {
  // shift is deliberately not blocked: '?' is typed as Shift+/.
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

  if (entry == null) {
    return null;
  }

  // The predicate above already guarantees entry.executable === true, so
  // entry.id belongs to the ExecutableShortcutId union — TypeScript simply
  // cannot narrow that through .find().
  return entry.id as ExecutableShortcutId;
};
