/**
 * Whether a keydown event is Alt+H (layout-independent).
 */
export const matchesToggleRefsShortcut = (event: {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  code: string;
  key: string;
}): boolean => {
  if (!event.altKey || event.ctrlKey || event.metaKey) {
    return false;
  }

  return event.code === "KeyH" || event.key.toLowerCase() === "h";
};
