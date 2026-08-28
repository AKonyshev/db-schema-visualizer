/**
 * One schema out of the catalogue, or `null` if it could not be read.
 *
 * A file listed in the manifest and missing from disk is possible in the
 * ordinary way of things: the manifest is built once, at start, and a mounted
 * folder can change under a running container. The caller says so in the tree
 * rather than opening an empty tab named after a file that is not there.
 */
export const loadSchemaText = async (path: string): Promise<string | null> => {
  // Segment by segment: the separators are part of the URL, and everything
  // between them is a name that may hold a space, an ampersand or a hash.
  const url = `/schemas/${path.split("/").map(encodeURIComponent).join("/")}`;

  try {
    // The folder can be a volume that was swapped between restarts, and these
    // names are not fingerprinted — a cached copy is a stale copy with no way
    // to notice.
    const response = await fetch(url, { cache: "no-store" });

    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
};
