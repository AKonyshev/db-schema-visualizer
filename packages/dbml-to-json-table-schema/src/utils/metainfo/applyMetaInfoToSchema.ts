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
      if (item.hidden === true) table.hasHiddenRefs = true;
    }
  });
};
