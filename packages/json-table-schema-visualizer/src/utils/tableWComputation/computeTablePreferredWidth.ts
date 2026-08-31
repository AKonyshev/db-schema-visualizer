import { computeTextSize } from "../computeTextSize";

import {
  FONT_SIZES,
  TABLE_DEFAULT_MIN_WIDTH,
  TABLE_FIELD_TYPE_PADDING,
} from "@/constants/sizing";

export const computeTablePreferredWidth = (
  lineWidths: number[],
  tableName: string,
): number => {
  const minColsW = lineWidths.length === 0 ? 0 : Math.max(...lineWidths);
  const { width: tableNameW } = computeTextSize(tableName, {
    fontSize: FONT_SIZES.tableTitle,
  });

  const maxOnColsAndTableName = Math.max(minColsW, tableNameW);

  return Math.max(
    maxOnColsAndTableName + TABLE_FIELD_TYPE_PADDING * 2,
    TABLE_DEFAULT_MIN_WIDTH,
  );
};
