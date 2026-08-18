import type { MetaInfoEntry } from "shared/types/metainfo";
import type { JSONTableSchema } from "shared/types/tableSchema";

export const applyMetaInfoToSchema = (
  schema: JSONTableSchema,
  metaInfo: MetaInfoEntry[],
): void => {
  metaInfo.forEach((item) => {
    const table = schema.tables.find((t) => t.name === item.name);
    if (table != null) {
      table.x = item.x;
      table.y = item.y;
      table.fromMetaInfo = true;
      // `hidden` is still read off the file and written back by
      // `upsertMetaInfoInDbml`, so a block written by an older version survives
      // untouched. Nothing acts on it any more: which tables have their
      // relations hidden is a view preference now, not a property of the schema.
    }
  });
};
