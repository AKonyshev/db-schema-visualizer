import type { MetaInfoEntry } from "shared/types/metainfo";

export const formatMetaInfoJson = (entries: MetaInfoEntry[]): string => {
  return JSON.stringify(entries)
    .replace("[{", "[\n{")
    .replace("}]", "}\n]")
    .replace(/},/g, "},\n");
};
