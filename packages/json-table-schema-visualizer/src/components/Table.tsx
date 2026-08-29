import { Group, Rect } from "react-konva";
import { useEffect, useMemo, useRef } from "react";

import TableHeader from "./TableHeader";
import Column from "./Column/Column";

import type { JSONTableTable } from "shared/types/tableSchema";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";

import {
  COLUMN_HEIGHT,
  PADDINGS,
  TABLE_HEADER_HEIGHT,
} from "@/constants/sizing";
import { useThemeColors, useThemeContext } from "@/hooks/theme";
import { Theme } from "@/types/theme";
import eventEmitter from "@/events-emitter";
import { computeTableDragEventName } from "@/utils/eventName";
import { useTableDefaultPosition, useTableWidth } from "@/hooks/table";
import { setHoveredTableName } from "@/stores/hoverStore";
import { tableCoordsStore } from "@/stores/tableCoords";
import { useTableRelationsVisibility } from "@/hooks/tableRelationsVisibility";
import { useTableDetailLevel } from "@/hooks/tableDetailLevel";
import { useAreRowsWorthDrawing } from "@/hooks/viewport";
import { TableDetailLevel } from "@/types/tableDetailLevel";
import { filterByDetailLevel } from "@/utils/filterByDetailLevel";
import computeFieldDisplayTypeName from "@/utils/getFieldType";
import { drawnTableHeight } from "@/utils/drawnTableHeight";

interface TableProps extends JSONTableTable {}

const Table = ({ fields, name }: TableProps) => {
  const themeColors = useThemeColors();
  // The dashed outline marks a table whose relations are hidden — the same
  // state the header icon toggles, so the two always agree.
  const { isHidden: hasHiddenRefs } = useTableRelationsVisibility(name);
  const { detailLevel } = useTableDetailLevel();
  const tableRef = useRef<null | Konva.Group>(null);
  const highlightRef = useRef<null | Konva.Rect>(null);
  const { theme } = useThemeContext();
  const { x: tableX, y: tableY } = useTableDefaultPosition(name);
  const tablePreferredWidth = useTableWidth();
  const visibleFields = useMemo(() => {
    return filterByDetailLevel(fields, detailLevel);
  }, [detailLevel, fields]);
  // The footprint below is computed from `visibleFields` either way: a table
  // that changed height with zoom would move every connection anchor and shift
  // the bounds fit-to-view works from, which oscillates around the threshold.
  // Only whether the rows are drawn depends on how far out the reader is.
  const rowsAreWorthDrawing = useAreRowsWorthDrawing();
  useEffect(() => {
    if (tableRef.current != null) {
      tableRef.current.x(tableX);
      tableRef.current.y(tableY);
      eventEmitter.emit(tableDragEventName, { x: tableX, y: tableY });
    }
  }, [tableX, tableY]);

  // The same function `computeDiagramBounds` frames this table with, so that
  // fit-to-view is computed for the drawing that is actually on screen.
  const tableHeight = drawnTableHeight(fields, detailLevel);

  const tableDragEventName = computeTableDragEventName(name);

  // Subscribe to highlight events for this table and animate the border
  useEffect(() => {
    const eventName = `highlight:table:${name}`;

    const handler = () => {
      const rect = highlightRef.current;
      if (rect === null || rect === undefined) return;

      const color = theme === Theme.dark ? "#FBBF24" : "#3B82F6";

      // Nombre de clignotements et intervalle
      const flashes = 3;
      const interval = 200; // ms

      let count = 0;
      rect.stroke(color);
      rect.opacity(1);
      rect.strokeWidth(5);

      const blinkInterval = setInterval(() => {
        rect.opacity(rect.opacity() === 1 ? 0 : 1);
        count++;
        if (count >= flashes * 2) {
          clearInterval(blinkInterval);
          // Reset strokeWidth and opacity
          rect.to({ strokeWidth: 0, opacity: 0, duration: 0.5 });
        }
      }, interval);
    };

    eventEmitter.on(eventName, handler);
    return () => {
      eventEmitter.off(eventName, handler);
    };
  }, [name, theme]);

  const propagateCoordinates = (node: Konva.Group) => {
    const existing = tableCoordsStore.getFullCoords(name);
    const tableCoords = {
      x: node.x(),
      y: node.y(),
      w: existing.w > 0 ? existing.w : tablePreferredWidth,
      h: existing.h > 0 ? existing.h : tableHeight,
    };
    eventEmitter.emit(tableDragEventName, tableCoords);
    tableCoordsStore.setFullCoords(name, tableCoords);
  };

  const handleOnDrag = (event: KonvaEventObject<DragEvent>) => {
    event.currentTarget.moveToTop();
    propagateCoordinates(event.target as Konva.Group);
  };

  const handleOnHover = () => {
    setHoveredTableName(name);
  };

  const handleOnBlur = () => {
    setHoveredTableName(null);
  };

  const moveTableToTop = () => {
    if (tableRef.current != null) {
      tableRef.current.moveToTop();
    }
  };

  return (
    <Group
      name={`table-${name.replace(/\s+/g, "_")}`}
      ref={tableRef}
      draggable
      onDragMove={handleOnDrag}
      width={tablePreferredWidth}
      height={tableHeight}
      onMouseEnter={handleOnHover}
      onMouseLeave={handleOnBlur}
      onClick={moveTableToTop}
    >
      <Rect
        shadowBlur={PADDINGS.xs}
        shadowOpacity={0.2}
        shadowColor={themeColors.table.shadow}
        shadowForStrokeEnabled={false}
        perfectDrawEnabled={false}
        height={tableHeight}
        width={tablePreferredWidth}
        fill={themeColors.table.bg}
        cornerRadius={PADDINGS.sm}
      />
      {hasHiddenRefs && (
        <Rect
          x={-3}
          y={-3}
          width={tablePreferredWidth + 6}
          height={tableHeight + 6}
          stroke="yellow"
          strokeWidth={1.5}
          dash={[6, 4]}
          fill="transparent"
          cornerRadius={PADDINGS.sm + 1}
          listening={false}
        />
      )}

      <TableHeader title={name} />
      {detailLevel !== TableDetailLevel.HeaderOnly && rowsAreWorthDrawing ? (
        <Group y={TABLE_HEADER_HEIGHT}>
          {visibleFields.map((field, index) => (
            <Column
              key={field.name}
              colName={field.name}
              tableName={name}
              isEnum={field.type.is_enum}
              type={computeFieldDisplayTypeName(field)}
              isPrimaryKey={field.pk}
              offsetY={index * COLUMN_HEIGHT}
              relationalTables={field.relational_tables}
              note={field.note}
            />
          ))}
        </Group>
      ) : (
        <></>
      )}

      {/* Highlight border temporarily when the a search option is clicked */}
      <Rect
        ref={highlightRef}
        height={tableHeight}
        width={tablePreferredWidth}
        cornerRadius={PADDINGS.sm}
        stroke={theme === Theme.dark ? "#FBBF24" : "#3B82F6"}
        strokeWidth={0}
        opacity={0}
        listening={false}
      />
    </Group>
  );
};

export default Table;
