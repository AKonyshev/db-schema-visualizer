import { Group, Rect } from "react-konva";

import KonvaText from "../dumb/KonvaText";

import { BADGE, COLUMN_HEIGHT, FONT_SIZES } from "@/constants/sizing";
import { badgesWidth, type FieldBadge } from "@/utils/fieldMarks";
import { computeTextSize } from "@/utils/computeTextSize";

interface ColumnBadgesProps {
  badges: FieldBadge[];
  /** Where the row ends. The badges are laid out back from it. */
  rowWidth: number;
  color: string;
}

/**
 * `PK` / `FK` / `UK` as pills at the right of a column line.
 *
 * Drawn back from the end of the row rather than forward from the type, because
 * the type is drawn right-aligned into the same row and nothing here knows
 * where it ended up. Laid out with `badgesWidth`, which is also what the table
 * was measured by, so the first pill starts exactly where the type text stops.
 */
const ColumnBadges = ({ badges, rowWidth, color }: ColumnBadgesProps) => {
  if (badges.length === 0) {
    return null;
  }

  let x = rowWidth - badgesWidth(badges) + BADGE.gap;

  return (
    <>
      {badges.map((badge) => {
        const textWidth = computeTextSize(badge, {
          fontSize: FONT_SIZES.badge,
        }).width;
        const width = textWidth + BADGE.paddingX * 2;
        const left = x;

        x += width + BADGE.gap;

        return (
          <Group
            key={badge}
            x={left}
            y={(COLUMN_HEIGHT - BADGE.height) / 2}
            listening={false}
          >
            <Rect
              width={width}
              height={BADGE.height}
              cornerRadius={BADGE.radius}
              fill={color}
              opacity={0.18}
            />
            <KonvaText
              text={badge}
              width={width}
              height={BADGE.height}
              align="center"
              verticalAlign="middle"
              fill={color}
              fontSize={FONT_SIZES.badge}
              fontStyle="bold"
              listening={false}
            />
          </Group>
        );
      })}
    </>
  );
};

export default ColumnBadges;
