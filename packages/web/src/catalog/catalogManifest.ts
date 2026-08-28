/**
 * The catalogue, as the page understands it.
 *
 * Everything here is checked rather than cast, for the same reason
 * `parseSession` checks what a browser stored: the value did not come from this
 * build. It was
 * written by a script in the container, over a folder an operator supplied, and
 * a manifest from a newer image — or one somebody put at that path by hand —
 * must leave the page working rather than blank with a `TypeError` in a console
 * nobody has open.
 */
export interface CatalogFile {
  /** Relative to the schemas folder, and the tail of the URL the file is at. */
  path: string;
  /** What to call it in the tree: a Project name, a comment, or the file name. */
  title: string;
}

export interface Catalog {
  files: CatalogFile[];
  /** What a first visit opens, or `null` for a catalogue with nothing in it. */
  defaultPath: string | null;
}

// Bumped only when the shape changes in a way this function cannot read. An
// image and a browser tab can be from different deployments.
const MANIFEST_VERSION = 1;

const isFile = (value: unknown): value is CatalogFile => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const file = value as Record<string, unknown>;

  return typeof file.path === "string" && typeof file.title === "string";
};

export const parseManifest = (parsed: unknown): Catalog | null => {
  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;

  if (candidate.version !== MANIFEST_VERSION) {
    return null;
  }

  const { files, default: defaultPath } = candidate;

  if (!Array.isArray(files) || !files.every(isFile)) {
    return null;
  }

  if (defaultPath !== null && typeof defaultPath !== "string") {
    return null;
  }

  // A default naming no file is dropped rather than taken at its word: it is
  // asked for before the first render, so the one thing it could produce is a
  // failed request in front of a reader who has not done anything yet.
  //
  // Dropped, and not grounds for refusing the whole manifest — the file list is
  // the catalogue, and one bad name in the field beside it is no reason to take
  // a reader's entire tree away.
  const named =
    defaultPath !== null && files.some((file) => file.path === defaultPath);

  return { files, defaultPath: named ? defaultPath : null };
};
