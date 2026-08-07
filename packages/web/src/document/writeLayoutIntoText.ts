import {
  upsertMetaInfoInDbml,
  type TableCoordEntry,
} from "dbml-to-json-table-schema";

/**
 * The current table positions, written into the DBML text itself.
 *
 * The writing is `upsertMetaInfoInDbml`, untouched and unwrapped in any other
 * sense: the metadata format is the compatibility contract with the extension,
 * so a second implementation of it here would be a second thing to keep in step
 * and the first thing to drift.
 *
 * What this adds is the one decision that function does not make — whether there
 * is anything to write at all. Handed nothing it appends an empty block, which
 * on the site is reachable by pressing the button before a diagram exists, and
 * leaves the reader looking at bookkeeping that says nothing.
 */
export const writeLayoutIntoText = (
  text: string,
  coords: TableCoordEntry[],
): string => (coords.length === 0 ? text : upsertMetaInfoInDbml(text, coords));
