import { MetaInfo } from "shared/types/metainfo";

import { METAINFO_END, METAINFO_START } from "./constants";
import { extractMetaInfo } from "./extractMetaInfo";
import { formatMetaInfoJson } from "./formatMetaInfoJson";

export interface TableCoordEntry {
  name: string;
  x: number;
  y: number;
}

export const upsertMetaInfoInDbml = (
  editorText: string,
  coords: TableCoordEntry[],
): string => {
  const hiddenByName = new Map<string, boolean>();
  const existing = extractMetaInfo(editorText);
  existing?.forEach((m) => {
    if (m.hidden === true) hiddenByName.set(m.name, true);
  });

  const metaInfo: MetaInfo[] = coords.map(
    ({ name, x, y }) =>
      new MetaInfo(name, Math.round(x), Math.round(y), hiddenByName.get(name)),
  );

  const mi = formatMetaInfoJson(metaInfo);
  const from = editorText.indexOf(METAINFO_START);
  const to = editorText.indexOf(METAINFO_END);

  if (from === -1) {
    return `${editorText}\n${METAINFO_START}\n${mi}\n${METAINFO_END}`;
  }

  const endMeta = to + METAINFO_END.length;
  return `${editorText.substring(0, from)}${METAINFO_START}\n${mi}\n${METAINFO_END}${editorText.substring(endMeta)}`;
};
