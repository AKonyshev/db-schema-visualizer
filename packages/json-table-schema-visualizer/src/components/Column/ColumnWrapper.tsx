import { type ReactNode, useState } from "react";
import { Group, Rect } from "react-konva";

import { COLUMN_HEIGHT } from "@/constants/sizing";
import { useTableWidth } from "@/hooks/table";
import { useIsColumnHighlighted } from "@/hooks/hover";

interface ColumnWrapperProps {
  children: (highlighted: boolean) => ReactNode;
  offsetY?: number;
  tableName: string;
  relationalTables?: string[] | null;
  highlightColor: string;
  columnName: string;
}

const ColumnWrapper = ({
  children,
  offsetY,
  tableName,
  relationalTables,
  highlightColor,
  columnName,
}: ColumnWrapperProps) => {
  const [hovered, setHovered] = useState(false);
  const tablePreferredWidth = useTableWidth();

  const handleOnHover = () => {
    setHovered(true);
  };

  const handleOnLeave = () => {
    setHovered(false);
  };

  // Its own pointer wins outright — the same short-circuit shouldHighLightCol
  // starts with — and the rest is one boolean this column alone subscribes to.
  const highlightedByHover = useIsColumnHighlighted({
    tableName,
    columnName,
    relationalTables,
  });
  const highlighted = hovered || highlightedByHover;

  return (
    <Group onMouseOver={handleOnHover} onMouseLeave={handleOnLeave} y={offsetY}>
      <Rect
        fill={highlighted ? highlightColor : "transparent"}
        width={tablePreferredWidth}
        height={COLUMN_HEIGHT}
      />
      {children(highlighted)}
    </Group>
  );
};

export default ColumnWrapper;
