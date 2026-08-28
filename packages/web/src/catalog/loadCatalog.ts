import { parseManifest, type Catalog } from "./catalogManifest";

export const CATALOG_URL = "/schemas/index.json";

// The request sits in front of the first render, so it cannot be allowed to
// take as long as the network is willing to wait. Five seconds is far beyond
// anything a file served by the same nginx that served the page can take, and
// far short of what a reader will stare at a blank page for.
const DEFAULT_TIMEOUT_MS = 5_000;

/**
 * The catalogue the image was built with, or `null` when there is none.
 *
 * Every way this can go wrong ends in the same answer, deliberately: a missing
 * manifest, a manifest from another version, the entry document `vite dev`
 * returns for an unknown path, a server that never answers. None of them is
 * something the reader can act on, and all of them mean the same thing — this
 * deployment has no schemas of its own, so the site is the site it was before
 * the catalogue existed.
 */
export const loadCatalog = async (
  // A parameter for one reason: the abort below is the branch most likely to be
  // wrong and the only one no caller can reach, so the test needs a way to wait
  // a millisecond instead of five seconds. The page never passes it.
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Catalog | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(CATALOG_URL, { signal: controller.signal });

    if (!response.ok) {
      return null;
    }

    return parseManifest(JSON.parse(await response.text()));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};
