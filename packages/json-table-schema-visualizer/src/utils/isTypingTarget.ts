export interface TypingTarget {
  tagName?: string;
  isContentEditable?: boolean;
  /** The ARIA role, reflected by `Element.role` on a real DOM node. */
  role?: string | null;
}

// Roles an element uses to say "text goes in here" when it is not a form
// control. Monaco 0.56 is the case that forced this: it takes input through the
// EditContext API on a plain `<div role="textbox">`, so matching tag names alone
// let the diagram's table search steal Ctrl/Cmd+F from the editor. Asking what
// an element claims to be outlasts knowing what any one editor builds itself
// from.
const TEXT_ENTRY_ROLES = new Set(["textbox", "searchbox", "combobox"]);

// The single definition of "the user is typing right now". Every shortcut
// handler consults it, so a field that swallows one shortcut swallows them all
// — the alternative is per-handler copies that drift, which is exactly how the
// table search ended up claiming Ctrl/Cmd+F from anything with focus.
export const isTypingTarget = (target: TypingTarget | null): boolean => {
  if (target == null) {
    return false;
  }

  const tag = target.tagName?.toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA") {
    return true;
  }

  if (target.isContentEditable === true) {
    return true;
  }

  return target.role != null && TEXT_ENTRY_ROLES.has(target.role);
};

// What an element uses the space bar for when it is not a text field: buttons,
// checkboxes and their ARIA equivalents are activated by it, and a link is
// scrolled past by it.
const SPACE_ACTIVATED_ROLES = new Set([
  "button",
  "checkbox",
  "radio",
  "switch",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "tab",
]);

const SPACE_ACTIVATED_TAGS = new Set(["BUTTON", "INPUT", "SELECT", "TEXTAREA"]);

/**
 * Whether the space bar already belongs to whatever holds focus.
 *
 * Its own predicate rather than a second reading of `isTypingTarget`, because
 * space is not typing: a focused button is not a place text goes, and it still
 * must not have the key taken from it. The diagram claims space to pan while
 * the reader is choosing tables, and claiming it from a focused toolbar button
 * would leave that button unusable by keyboard.
 */
export const isSpaceActivatedTarget = (
  target: TypingTarget | null,
): boolean => {
  if (target == null) {
    return false;
  }

  if (isTypingTarget(target)) {
    return true;
  }

  const tag = target.tagName?.toUpperCase();

  if (tag !== undefined && SPACE_ACTIVATED_TAGS.has(tag)) {
    return true;
  }

  return target.role != null && SPACE_ACTIVATED_ROLES.has(target.role);
};
