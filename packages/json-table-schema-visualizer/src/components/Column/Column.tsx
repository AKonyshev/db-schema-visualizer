import KonvaText from "../dumb/KonvaText";
import FieldDetails from "../FieldDetails/FieldDetails";

import ColumnWrapper from "./ColumnWrapper";
import ColumnBadges from "./ColumnBadges";

import { useTableColor } from "@/hooks/tableColor";
import {
  COLUMN_HEIGHT,
  FONT_SIZES,
  PADDINGS,
  TABLE_FIELD_TYPE_PADDING,
} from "@/constants/sizing";
import { useThemeColors } from "@/hooks/theme";
import { useTableWidth } from "@/hooks/table";
import {
  badgesWidth,
  fieldTypeText,
  type FieldMarks,
} from "@/utils/fieldMarks";

interface ColumnProps {
  colName: string;
  tableName: string;
  /** The type, the mandatory mark and the key badges; see `computeFieldMarks`. */
  marks: FieldMarks;
  isPrimaryKey?: boolean;
  isEnum: boolean;
  relationalTables?: string[] | null;
  offsetY?: number;
  note?: string;
}

const Column = ({
  colName,
  tableName,
  marks,
  isPrimaryKey = false,
  offsetY,
  relationalTables,
  isEnum,
  note,
}: ColumnProps) => {
  const themeColors = useThemeColors();
  const tableColors = useTableColor(tableName);
  const tablePreferredWidth = useTableWidth();

  const badgeRoom = badgesWidth(marks.badges);
  const colTextColor = themeColors.text[900];
  const typeTextColor = themeColors.text[700];
  const fontStyle = isPrimaryKey ? "bold" : "normal";
  const colNameBaseFill = isPrimaryKey
    ? tableColors?.regular ?? colTextColor
    : colTextColor;

  return (
    <ColumnWrapper
      highlightColor={tableColors?.lighter ?? themeColors.colAccent}
      relationalTables={relationalTables}
      offsetY={offsetY}
      tableName={tableName}
      columnName={colName}
    >
      {(highlighted) => (
        <>
          <KonvaText
            listening={false}
            ellipsis
            wrap="none"
            text={colName}
            fill={
              highlighted
                ? tableColors?.regular ?? colNameBaseFill
                : colNameBaseFill
            }
            width={tablePreferredWidth}
            fontStyle={fontStyle}
            padding={PADDINGS.sm}
            height={COLUMN_HEIGHT}
            fontSize={FONT_SIZES.md}
          />

          <KonvaText
            listening={false}
            text={fieldTypeText(marks)}
            align="right"
            // Narrowed by exactly what the badges take, so the type stops where
            // the first pill begins. Both sides read the same measurement.
            width={tablePreferredWidth - badgeRoom}
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing
            fill={(highlighted && tableColors?.regular) || typeTextColor}
            padding={TABLE_FIELD_TYPE_PADDING}
            fontStyle={fontStyle}
            fontSize={FONT_SIZES.md}
            height={COLUMN_HEIGHT}
          />

          <ColumnBadges
            badges={marks.badges}
            rowWidth={tablePreferredWidth - TABLE_FIELD_TYPE_PADDING}
            color={tableColors?.regular ?? colTextColor}
          />

          {note != null || isEnum ? (
            <FieldDetails note={note ?? ""} enumName={marks.typeName} />
          ) : null}
        </>
      )}
    </ColumnWrapper>
  );
};

export default Column;
