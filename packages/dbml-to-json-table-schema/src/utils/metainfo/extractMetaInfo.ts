import { METAINFO_END, METAINFO_START } from "./constants";

import type { MetaInfoEntry } from "shared/types/metainfo";

export const extractMetaInfo = (dbmlCode: string): MetaInfoEntry[] | null => {
  const startIdx = dbmlCode.indexOf(METAINFO_START);
  if (startIdx === -1) return null;

  const contentStart = startIdx + METAINFO_START.length;
  const endIdx = dbmlCode.indexOf(METAINFO_END, contentStart);
  if (endIdx === -1) return null;

  const jsonStr = dbmlCode.substring(contentStart, endIdx).trim();
  try {
    return JSON.parse(jsonStr) as MetaInfoEntry[];
  } catch {
    return null;
  }
};
