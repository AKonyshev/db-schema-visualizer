import {
  DEFAULT_META_INFO_DETAIL_LEVEL,
  type MetaInfoEntry,
} from "shared/types/metainfo";

import type { JSONTableSchema } from "shared/types/tableSchema";

export const applyMetaInfoToSchema = (
  schema: JSONTableSchema,
  metaInfo: MetaInfoEntry[],
): void => {
  metaInfo.forEach((item) => {
    const table = schema.tables.find((t) => t.name === item.name);
    if (table != null) {
      table.fromMetaInfo = true;

      // One entry per table per level, so a table is met once for each
      // arrangement the file holds rather than once in total.
      const level = item.detailLevel ?? DEFAULT_META_INFO_DETAIL_LEVEL;
      table.metaInfoPositions = {
        ...table.metaInfoPositions,
        [level]: { x: item.x, y: item.y },
      };

      // `x` and `y` are what a reader knowing nothing of levels uses, and the
      // full-detail arrangement is the one with room enough to be drawn at any
      // level — so it wins whenever the file has one.
      const chosen =
        table.metaInfoPositions[DEFAULT_META_INFO_DETAIL_LEVEL] ?? item;
      table.x = chosen.x;
      table.y = chosen.y;

      // `hidden` is still read off the file and written back by
      // `upsertMetaInfoInDbml`, so a block written by an older version survives
      // untouched. Nothing acts on it any more: which tables have their
      // relations hidden is a view preference now, not a property of the schema.
    }
  });
};
