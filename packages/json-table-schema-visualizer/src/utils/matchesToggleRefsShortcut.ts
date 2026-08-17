/**
 * Whether a keydown event is Alt+H (layout-independent).
 *
 * Option+H on a Mac types "˙". VS Code webviews sometimes omit `code` and
 * sometimes drop `altKey` on that composed keydown; either still counts.
 */
const MAC_OPTION_H = "˙";

export const matchesToggleRefsShortcut = (event: {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  code: string;
  key: string;
}): boolean => {
  if (event.ctrlKey || event.metaKey) {
    return false;
  }

  const isH =
    event.code === "KeyH" ||
    event.key.toLowerCase() === "h" ||
    event.key === MAC_OPTION_H;

  if (!isH) {
    return false;
  }

  return event.altKey || event.key === MAC_OPTION_H;
};
