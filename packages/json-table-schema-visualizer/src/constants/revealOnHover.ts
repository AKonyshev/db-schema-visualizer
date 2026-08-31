/**
 * Controls that are not there until the reader reaches for them.
 *
 * For a host whose diagram shares a page with something else — the embedded
 * frame in a documentation page, which may be five hundred pixels tall. The
 * toolbar floats over the bottom of the diagram and the search box over its
 * top-right corner; in a window each costs a strip of empty canvas, in a frame
 * they cover the thing the page put there to be looked at.
 *
 * `visibility`, not opacity: a control that cannot be seen but still answers the
 * pointer and still reads out to a screen reader is worse than one that is
 * honestly not there. What that costs is that it cannot be focused either, which
 * is why the search bar checks before claiming Ctrl+F.
 *
 * Named for the group that `DiagramViewer` puts on the box holding all of this.
 */
export const REVEAL_ON_HOVER =
  "invisible opacity-0 transition-opacity duration-150 " +
  "group-hover/diagram:visible group-hover/diagram:opacity-100 " +
  "group-focus-within/diagram:visible group-focus-within/diagram:opacity-100";
