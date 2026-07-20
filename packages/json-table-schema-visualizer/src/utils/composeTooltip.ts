// The tooltip is the only thing explaining an icon-only button, so its text is
// assembled in one place rather than at each call site: a missing shortcut must
// degrade to the bare label, never to "undefined" or empty brackets.
export const composeTooltip = (label: string, shortcutKey?: string): string => {
  if (shortcutKey == null || shortcutKey.trim() === "") {
    return label;
  }

  return `${label} (${shortcutKey.toUpperCase()})`;
};
