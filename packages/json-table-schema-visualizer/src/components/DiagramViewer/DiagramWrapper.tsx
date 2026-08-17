import { Group, Layer, Stage } from "react-konva";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type JSONTableRef,
  type JSONTableTable,
} from "shared/types/tableSchema";
import { type KonvaEventObject } from "konva/lib/Node";

import Toolbar from "../Toolbar/Toolbar";
import ShortcutsLegend from "../ShortcutsLegend/ShortcutsLegend";

import type { Stage as CoreStage } from "konva/lib/Stage";

import { STORAGE_KEYS } from "@/constants/storageKeys";
import { useElementSize } from "@/hooks/elementSize";
import { useCursorChanger } from "@/hooks/cursor";
import { DIAGRAM_PADDING } from "@/constants/sizing";
import { useThemeColors } from "@/hooks/theme";
import { useStageStartingState } from "@/hooks/stage";
import { stageStateStore } from "@/stores/stagesState";
import { useScrollDirectionContext } from "@/hooks/scrollDirection";
import eventEmitter from "@/events-emitter";
import { tableCoordsStore } from "@/stores/tableCoords";
import { useTablePositionContext } from "@/hooks/table";
import {
  getHighlightedColumns,
  getHoveredTableName,
  setHighlightedColumns,
  setHoveredTableName,
} from "@/stores/hoverStore";
import { exportStageSVG } from "@/export/svg/svg-exporter";
import { generateAsciiDoc } from "@/utils/exportAsciiDoc";
import { generateMarkdown } from "@/utils/exportMarkdown";
import useLocalStorage from "@/hooks/localStorage";
import { useKeyboardShortcuts } from "@/hooks/keyboardShortcuts";
import { useTableDetailLevel } from "@/hooks/tableDetailLevel";
import { computeWheelZoom } from "@/utils/computeWheelZoom";

interface DiagramWrapperProps {
  connections: ReactNode;
  tables: ReactNode;
  tablesMeta: JSONTableTable[];
  refs: JSONTableRef[];
}

interface PendingWheelEvent {
  deltaY: number;
  ctrlKey: boolean;
  pointerX: number;
  pointerY: number;
}

const DiagramWrapper = ({
  connections,
  tables,
  tablesMeta,
  refs,
}: DiagramWrapperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { height: viewHeight, width: viewWidth } = useElementSize(containerRef);
  const { scrollDirection } = useScrollDirectionContext();
  const { onChange: onGrabbing, onRestore: onGrabRelease } =
    useCursorChanger("grabbing");
  const themeColors = useThemeColors();
  const stageRef = useRef<null | CoreStage>(null);

  // repositioning the stage only once
  const { scale: defaultStageScale, position: defaultStagePosition } =
    useStageStartingState({ width: viewWidth, height: viewHeight });
  const hasPositionedStage = useRef(false);
  useEffect(() => {
    // Once, and only after there is a real size to fit into. The starting state
    // now depends on the container's dimensions, so without this guard every
    // resize — a dragged divider most of all — would re-fit the diagram and
    // throw away the reader's pan. Panning is not persisted, so there would be
    // nothing to restore it from.
    if (
      hasPositionedStage.current ||
      stageRef.current === null ||
      viewWidth === 0 ||
      viewHeight === 0
    ) {
      return;
    }

    stageRef.current.scale({
      x: defaultStageScale,
      y: defaultStageScale,
    });
    stageRef.current.position(defaultStagePosition);
    hasPositionedStage.current = true;
  }, [defaultStageScale, defaultStagePosition, viewWidth, viewHeight]);

  const pendingWheelRef = useRef<PendingWheelEvent | null>(null);
  const wheelFrameRef = useRef<number | null>(null);

  const applyPendingWheelZoom = useCallback((): void => {
    wheelFrameRef.current = null;
    const pending = pendingWheelRef.current;
    pendingWheelRef.current = null;
    const stage = stageRef.current;
    if (pending === null || stage === null) {
      return;
    }

    const { scale, position } = computeWheelZoom({
      oldScale: stage.scaleX(),
      deltaY: pending.deltaY,
      ctrlKey: pending.ctrlKey,
      scrollDirection,
      pointerX: pending.pointerX,
      pointerY: pending.pointerY,
      stageX: stage.x(),
      stageY: stage.y(),
    });

    stage.scale({ x: scale, y: scale });
    stage.position(position);
    stage.batchDraw();
    stageStateStore.set({ scale, position });
  }, [scrollDirection]);

  useEffect(
    () => () => {
      if (wheelFrameRef.current !== null) {
        cancelAnimationFrame(wheelFrameRef.current);
      }
    },
    [],
  );

  const handleZooming = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.currentTarget as CoreStage;
    const pointer = stage.getPointerPosition();
    if (pointer === null) {
      return;
    }

    const pending = pendingWheelRef.current;
    if (pending === null) {
      pendingWheelRef.current = {
        deltaY: e.evt.deltaY,
        ctrlKey: e.evt.ctrlKey,
        pointerX: pointer.x,
        pointerY: pointer.y,
      };
    } else {
      pending.deltaY += e.evt.deltaY;
      pending.ctrlKey = e.evt.ctrlKey;
      pending.pointerX = pointer.x;
      pending.pointerY = pointer.y;
    }

    if (wheelFrameRef.current === null) {
      wheelFrameRef.current = requestAnimationFrame(applyPendingWheelZoom);
    }
  };

  const nodeBelongsToTable = (node: any): boolean => {
    let currentNode = node;
    while (currentNode != null) {
      if (
        typeof currentNode.name === "function" &&
        typeof currentNode.name() === "string"
      ) {
        const names = (currentNode.name() as string).split(/\s+/);
        if (names.some((n) => n.startsWith("table-"))) {
          return true;
        }
      }
      currentNode = currentNode.getParent?.() ?? null;
    }
    return false;
  };

  const handleStagePointerDown = (
    e: KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    // Read at the moment of the click rather than subscribed to: this component
    // has no reason to re-render as the pointer crosses tables.
    const highlightedColumns = getHighlightedColumns();
    if (
      getHoveredTableName() == null &&
      (highlightedColumns == null || highlightedColumns.length === 0)
    )
      return;
    if (nodeBelongsToTable(e.target)) return;
    setHoveredTableName(null);
    setHighlightedColumns([]);
  };

  const fitToView = () => {
    if (stageRef.current != null) {
      const stage = stageRef.current;
      const container = stage.container();
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      const contentBounds = stage.getClientRect({ relativeTo: stage });
      contentBounds.x = contentBounds.x - DIAGRAM_PADDING;
      contentBounds.y = contentBounds.y - DIAGRAM_PADDING;
      contentBounds.width = contentBounds.width + 2 * DIAGRAM_PADDING;
      contentBounds.height = contentBounds.height + 2 * DIAGRAM_PADDING;
      const scaleX = containerWidth / contentBounds.width;
      const scaleY = containerHeight / contentBounds.height;
      const scale = Math.min(scaleX, scaleY);

      stage.scale({ x: scale, y: scale });
      stage.position({
        x:
          (containerWidth - contentBounds.width * scale) / 2 -
          contentBounds.x * scale,
        y:
          (containerHeight - contentBounds.height * scale) / 2 -
          contentBounds.y * scale,
      });
      stage.batchDraw();
      stageStateStore.set({ scale, position: stage.position() });
    }
  };

  /**
   * A fresh arrangement gets a fresh view.
   *
   * Auto-arrange moves every table at once, so the framing the reader had was
   * framing a layout that no longer exists — press `L` on a diagram you have
   * zoomed into and the result can land entirely off-screen, with nothing on
   * screen changing to say why.
   *
   * This is deliberately *not* the `hasPositionedStage` path above. That one
   * answers "where does the stage start", once, and must keep refusing to run
   * again — a re-fit on every recomputation would take the reader's pan away
   * whenever the split divider moved. This one answers a different question:
   * the coordinates were replaced, so frame what replaced them.
   *
   * The same event covers opening a file and switching to a document with no
   * stored layout, which are the other two ways a whole arrangement is computed
   * at once. Framing those is right for the same reason.
   */
  useEffect(() => {
    return tableCoordsStore.subscribeToReset(() => {
      // Next frame, not now. The store emits before React has re-rendered the
      // tables at their new coordinates, so measuring the stage here would frame
      // the arrangement that has just been replaced — the old view, computed
      // twice.
      requestAnimationFrame(() => {
        fitToView();
      });
    });
    // `fitToView` reads nothing but `stageRef` and constants, so the copy
    // captured here stays correct for the life of the component.
  }, []);

  const [, setColorRelations] = useLocalStorage<boolean>(
    STORAGE_KEYS.COLOR_RELATIONS,
    false,
  );
  const [, setAnimateRelations] = useLocalStorage<boolean>(
    STORAGE_KEYS.ANIMATE_RELATIONS,
    false,
  );
  const [, setShortTableName] = useLocalStorage<boolean>(
    STORAGE_KEYS.SHORT_TABLE_NAME,
    false,
  );
  const { next: nextDetailLevel } = useTableDetailLevel();
  const { resetPositions } = useTablePositionContext();
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  useKeyboardShortcuts(
    {
      colorRelations: () => {
        setColorRelations((prev) => !prev);
      },
      animateRelations: () => {
        setAnimateRelations((prev) => !prev);
      },
      shortTableName: () => {
        setShortTableName((prev) => !prev);
      },
      detailLevel: nextDetailLevel,
      autoArrange: resetPositions,
      fitToView,
      legend: () => {
        setIsLegendOpen(true);
      },
    },
    !isLegendOpen,
  );

  /**
   * Center handler: listen for requests to center the stage on a given table
   *  when the search option is clicked.
   */
  useEffect(() => {
    const handler = ({ tableName }: { tableName: string }) => {
      if (stageRef.current == null) return;

      const stage = stageRef.current;
      const container = stage.container();
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      // Try to find the node by name first
      const nodeName = `table-${tableName.replace(/\s+/g, "_")}`;
      // Konva's findOne accepts a selector like `.name`
      const node = stage.findOne(`.${nodeName}`);

      // Get bounding rect relative to stage
      let rect: { x: number; y: number; width: number; height: number };
      if (node != null && typeof (node as any).getClientRect === "function") {
        rect = (node as any).getClientRect({ relativeTo: stage });
      } else {
        // Fallback to stored coords (top-left) and assume a small box
        const coords = tableCoordsStore.getCoords(tableName);
        rect = { x: coords.x, y: coords.y, width: 200, height: 100 };
      }

      const scale = stage.scaleX();

      const newPos = {
        x: containerWidth / 2 - (rect.x + rect.width / 2) * scale,
        y: containerHeight / 2 - (rect.y + rect.height / 2) * scale,
      };

      // animate stage position for a smooth pan
      try {
        (stage as any).to({
          x: newPos.x,
          y: newPos.y,
          duration: 0.45,
          onFinish: () => {
            stage.batchDraw();
            stageStateStore.set({ scale: stage.scaleX(), position: newPos });
          },
        });
      } catch (e) {
        // fallback to immediate set
        stage.position(newPos);
        stage.batchDraw();
        stageStateStore.set({ scale: stage.scaleX(), position: newPos });
      }
    };

    eventEmitter.on("table:center", handler);
    return () => {
      eventEmitter.off("table:center", handler);
    };
  }, []);

  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const onDownloadPng = () => {
    if (stageRef.current == null) return;
    const stage = stageRef.current;

    // Save current stage state
    const originalScale = stage.scaleX();
    const originalPosition = { ...stage.position() };

    // Reset stage to scale 1 and position 0,0 to get actual content bounds
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });

    const contentBounds = stage.getClientRect({ relativeTo: stage });

    // Calculate square dimensions (use the larger dimension)
    const maxDimension = Math.max(contentBounds.width, contentBounds.height);

    // Center the content in the square
    const offsetX = (maxDimension - contentBounds.width) / 2;
    const offsetY = (maxDimension - contentBounds.height) / 2;

    const data = stage.toDataURL({
      x: contentBounds.x - offsetX,
      y: contentBounds.y - offsetY,
      width: maxDimension,
      height: maxDimension,
      pixelRatio: 2,
    });

    // Restore original stage state
    stage.scale({ x: originalScale, y: originalScale });
    stage.position(originalPosition);

    const link = document.createElement("a");
    link.href = data;
    link.download = `diagram-${Date.now()}.png`;
    link.click();
  };

  const onDownloadSvg = async () => {
    if (stageRef.current == null) return;
    const result = await exportStageSVG(stageRef.current, true);
    if (result instanceof Blob) {
      downloadBlob(result, `diagram-${Date.now()}.svg`);
    }
  };

  const onDownloadMarkdown = () => {
    const markdown = generateMarkdown(tablesMeta, refs);
    const blob = new Blob([markdown], { type: "text/markdown" });
    downloadBlob(blob, `diagram-${Date.now()}.md`);
  };

  const onDownloadAdoc = () => {
    const asciiDoc = generateAsciiDoc(tablesMeta, refs);
    const blob = new Blob([asciiDoc], { type: "text/plain" });
    downloadBlob(blob, `diagram-${Date.now()}.adoc`);
  };

  return (
    // `relative` so the toolbar below anchors to this box rather than to the
    // page, and `overflow-hidden` so a stage mid-resize cannot widen the
    // document. Both matter only once the diagram shares a page with something
    // else, which is exactly when they stop being cosmetic.
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <Stage
        draggable
        ref={stageRef}
        onDragStart={onGrabbing}
        onDragEnd={onGrabRelease}
        onWheel={handleZooming}
        onMouseDown={handleStagePointerDown}
        onTouchStart={handleStagePointerDown}
        width={viewWidth}
        height={viewHeight}
        style={{ backgroundColor: themeColors.bg }}
      >
        <Layer>
          <Group offsetX={-DIAGRAM_PADDING} offsetY={-DIAGRAM_PADDING}>
            {connections}
          </Group>
        </Layer>
        <Layer>
          <Group offsetX={-DIAGRAM_PADDING} offsetY={-DIAGRAM_PADDING}>
            {tables}
          </Group>
        </Layer>
      </Stage>

      <Toolbar
        onFitToView={fitToView}
        onDownloadPng={onDownloadPng}
        onDownloadSvg={() => {
          void onDownloadSvg();
        }}
        onDownloadAdoc={onDownloadAdoc}
        onDownloadMarkdown={onDownloadMarkdown}
        onShowLegend={() => {
          setIsLegendOpen(true);
        }}
      />

      {isLegendOpen && (
        <ShortcutsLegend
          onClose={() => {
            setIsLegendOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default DiagramWrapper;
