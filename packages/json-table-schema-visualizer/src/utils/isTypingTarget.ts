export interface TypingTarget {
  tagName?: string;
  isContentEditable?: boolean;
}

// The single definition of "the user is typing right now". Every shortcut
// handler consults it, so a field that swallows one shortcut swallows them all
// — the alternative is per-handler copies that drift, which is exactly how the
// table search ended up claiming Ctrl/Cmd+F from anything with focus.
export const isTypingTarget = (target: TypingTarget | null): boolean => {
  if (target == null) {
    return false;
  }

  const tag = target.tagName?.toUpperCase();

  return (
    tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable === true
  );
};
