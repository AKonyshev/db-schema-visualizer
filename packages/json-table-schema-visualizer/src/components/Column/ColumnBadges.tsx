import { Group, Rect } from "react-konva";

import KonvaText from "../dumb/KonvaText";

import { BADGE, COLUMN_HEIGHT, FONT_SIZES } from "@/constants/sizing";
import { type BadgeLayout } from "@/utils/fieldMarks";

interface ColumnBadgesProps {
  /** Computed by the caller; see `badgeLayout`. */
  layout: BadgeLayout;
  /** Where the row ends. The block is placed back from it. */
  rowWidth: number;
  color: string;
}

/**
 * `PK` / `FK` / `UK` as pills at the right of a column line.
 *
 * Placed back from the end of the row rather than forward from the type,
 * because the type is drawn right-aligned into the same row and nothing here
 * knows where it ended up.
 *
 * The layout arrives already computed rather than being worked out here: the
 * caller narrows the type by the same total, and two places computing one
 * number is two places to drift.
 */
const ColumnBadges = ({ layout, rowWidth, color }: ColumnBadgesProps) => {
  if (layout.pills.length === 0) {
    return null;
  }

  const left = rowWidth - layout.totalWidth;

  return (
    <>
      {layout.pills.map((pill) => (
        <Group
          key={pill.badge}
          x={left + pill.x}
          y={(COLUMN_HEIGHT - BADGE.height) / 2}
          listening={false}
        >
          <Rect
            width={pill.width}
            height={BADGE.height}
            cornerRadius={BADGE.radius}
            fill={color}
            opacity={0.18}
          />
          <KonvaText
            text={pill.badge}
            width={pill.width}
            height={BADGE.height}
            align="center"
            verticalAlign="middle"
            fill={color}
            fontSize={FONT_SIZES.badge}
            fontStyle="bold"
            listening={false}
          />
        </Group>
      ))}
    </>
  );
};

export default ColumnBadges;
