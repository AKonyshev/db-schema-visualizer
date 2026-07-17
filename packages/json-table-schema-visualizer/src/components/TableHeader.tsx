import { Group, Rect, Line, Circle } from "react-konva";

import KonvaText from "./dumb/KonvaText";

import type { KonvaEventObject } from "konva/lib/Node";

import {
  COLUMN_HEIGHT,
  FONT_SIZES,
  PADDINGS,
  TABLE_COLOR_HEIGHT,
} from "@/constants/sizing";
import { useThemeColors } from "@/hooks/theme";
import { useTableColor } from "@/hooks/tableColor";
import { useTableWidth, useTablesInfo } from "@/hooks/table";
import useLocalStorage from "@/hooks/localStorage";
import { useTableRelationsVisibility } from "@/hooks/tableRelationsVisibility";
import { shouldShowRelationsIcon } from "@/utils/shouldShowRelationsIcon";

interface TableHeaderProps {
  title: string;
}

const setCursor = (
  event: KonvaEventObject<MouseEvent>,
  cursor: string,
): void => {
  const container = event.target.getStage()?.container();
  if (container != null) {
    container.style.cursor = cursor;
  }
};

const TableHeader = ({ title }: TableHeaderProps) => {
  const [isShortTableName] = useLocalStorage<boolean>(
    "shortTableNameSetting",
    false,
  );
  const titleDisplay = isShortTableName ? title.split(".")[1] ?? title : title;
  const themeColors = useThemeColors();
  const tableColors = useTableColor(title);
  const tablePreferredWidth = useTableWidth();
  const tableMarkerColor = tableColors?.regular ?? "red";

  const { hoveredTableName } = useTablesInfo();
  const isHovered = hoveredTableName === title;
  const { isHidden, toggle } = useTableRelationsVisibility(title);
  const showIcon = shouldShowRelationsIcon(isHovered, isHidden);

  // icon geometry: a small relation glyph on the right of the header row
  const headerCenterY = TABLE_COLOR_HEIGHT + COLUMN_HEIGHT / 2;
  const iconCenterX = tablePreferredWidth - PADDINGS.md;
  const glyphColor = themeColors.tableHeader.fg;

  const handleIconClick = (
    event: KonvaEventObject<MouseEvent | TouchEvent>,
  ): void => {
    event.cancelBubble = true;
    toggle();
  };

  return (
    <Group>
      <Rect
        cornerRadius={[PADDINGS.sm, PADDINGS.sm]}
        fill={tableMarkerColor}
        height={TABLE_COLOR_HEIGHT}
        width={tablePreferredWidth}
      />

      <Rect
        y={TABLE_COLOR_HEIGHT}
        fill={themeColors.tableHeader.bg}
        width={tablePreferredWidth}
        height={COLUMN_HEIGHT}
      />

      <KonvaText
        text={titleDisplay}
        y={TABLE_COLOR_HEIGHT}
        fill={themeColors.tableHeader.fg}
        width={tablePreferredWidth}
        height={COLUMN_HEIGHT}
        align="center"
        strokeWidth={PADDINGS.xs}
        padding={PADDINGS.xs}
        fontSize={FONT_SIZES.tableTitle}
      />

      {showIcon && (
        <Group
          onClick={handleIconClick}
          onTap={handleIconClick}
          onMouseEnter={(e) => {
            setCursor(e, "pointer");
          }}
          onMouseLeave={(e) => {
            setCursor(e, "default");
          }}
          opacity={isHidden ? 0.45 : 1}
        >
          {/* transparent hit area (Konva hit-tests a set fill regardless of
              alpha, so `fill="transparent"` makes this Rect clickable) */}
          <Rect
            x={iconCenterX - 9}
            y={headerCenterY - 9}
            width={18}
            height={18}
            fill="transparent"
          />
          {/* relation glyph: two nodes joined by a line */}
          <Line
            points={[
              iconCenterX - 5,
              headerCenterY,
              iconCenterX + 5,
              headerCenterY,
            ]}
            stroke={glyphColor}
            strokeWidth={1.5}
          />
          <Circle
            x={iconCenterX - 5}
            y={headerCenterY}
            radius={2.4}
            fill={glyphColor}
          />
          <Circle
            x={iconCenterX + 5}
            y={headerCenterY}
            radius={2.4}
            fill={glyphColor}
          />
          {/* strike-through when hidden */}
          {isHidden && (
            <Line
              points={[
                iconCenterX - 7,
                headerCenterY - 7,
                iconCenterX + 7,
                headerCenterY + 7,
              ]}
              stroke={glyphColor}
              strokeWidth={1.5}
            />
          )}
        </Group>
      )}
    </Group>
  );
};

export default TableHeader;
