/**
 * The last segment of a catalogue path.
 *
 * Its own file because both the tree and the tab a catalogue file opens into
 * need it, and neither is a natural home for the other's use of it. The
 * separator is always `/`: these paths come from a URL and from a manifest
 * built on Linux, never from a Windows filesystem.
 */
export const fileNameOf = (path: string): string => {
  const cut = path.lastIndexOf("/");

  return cut === -1 ? path : path.slice(cut + 1);
};
