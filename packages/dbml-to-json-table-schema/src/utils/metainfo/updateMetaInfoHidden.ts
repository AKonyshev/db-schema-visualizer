import { METAINFO_END, METAINFO_START } from "./constants";
import { formatMetaInfoJson } from "./formatMetaInfoJson";

import type { TableCoordEntry } from "./upsertMetaInfoInDbml";

export const updateMetaInfoHidden = (
  content: string,
  tableName: string,
  isHiding: boolean,
  coords?: TableCoordEntry,
): string => {
  const startIdx = content.indexOf(METAINFO_START);

  if (startIdx === -1) {
    if (!isHiding || coords === undefined) return content;
    const entry = {
      name: tableName,
      x: Math.round(coords.x),
      y: Math.round(coords.y),
      hidden: true,
    };
    const json = `[\n${JSON.stringify(entry)}\n]`;
    return `${content}\n${METAINFO_START}\n${json}\n${METAINFO_END}`;
  }

  const contentStart = startIdx + METAINFO_START.length;
  const endIdx = content.indexOf(METAINFO_END, contentStart);
  if (endIdx === -1) return content;

  try {
    const existing = JSON.parse(
      content.substring(contentStart, endIdx).trim(),
    ) as Array<{
      name: string;
      x: number;
      y: number;
      hidden?: boolean;
    }>;
    const entry = existing.find((m) => m.name === tableName);
    if (entry != null) {
      if (isHiding) entry.hidden = true;
      else delete entry.hidden;
    } else if (isHiding && coords !== undefined) {
      existing.push({
        name: tableName,
        x: Math.round(coords.x),
        y: Math.round(coords.y),
        hidden: true,
      });
    }
    const newJson = formatMetaInfoJson(existing);
    return (
      content.substring(0, startIdx) +
      METAINFO_START +
      "\n" +
      newJson +
      "\n" +
      METAINFO_END +
      content.substring(endIdx + METAINFO_END.length)
    );
  } catch {
    return content;
  }
};
