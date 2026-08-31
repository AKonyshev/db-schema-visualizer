import { Group, Layer, Rect, Stage } from "react-konva";
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
import type { Group as CoreGroup } from "konva/lib/Group";

import { STORAGE_KEYS } from "@/constants/storageKeys";
import { useElementSize } from "@/hooks/elementSize";
import { useCursorChanger } from "@/hooks/cursor";
import { DIAGRAM_PADDING } from "@/constants/sizing";
import { REVEAL_ON_HOVER } from "@/constants/revealOnHover";
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
import { computeDiagramBounds } from "@/utils/diagramBounds";
import { viewportStore } from "@/stores/viewportStore";
import { toggleInteractionMode } from "@/stores/interactionModeStore";
import { useIsSelectMode } from "@/hooks/selection";
import {
  isSpaceActivatedTarget,
  isTypingTarget,
  type TypingTarget,
} from "@/utils/isTypingTarget";
import { selectionStore } from "@/stores/selectionStore";
import {
  normalizeMarquee,
  selectionFromMarquee,
  type Marquee,
} from "@/utils/selectionFromMarquee";

interface DiagramWrapperProps {
  connections: ReactNode;
  tables: ReactNode;
  tablesMeta: JSONTableTable[];
  refs: JSONTableRef[];
  /** Passed straight through to the toolbar; see `DiagramApp`. */
  hostActions?: ReactNode;
  /**
   * Keep the whole diagram framed — on the first render instead of the starting
   * state, and again whenever the container changes size — for a host whose
   * reader cannot pan to find it.
   *
   * The embedded frame in a documentation page is that host: it can be a few
   * hundred pixels tall, it opens on a slice of a model somebody chose, and the
   * reader is reading prose around it rather than exploring a canvas. An
   * application's reader has a whole window and a toolbar; a page's reader has
   * whatever the author's `height=` gave them.
   *
   * Re-framing on resize is the part the other hosts must not have: for them a
   * resize is a dragged divider, and re-framing would throw away a pan that is
   * persisted nowhere. For this one a resize is the reader asking for the
   * diagram across the page, and leaving the old framing behind would answer by
   * putting the same small picture in the corner of a large empty one.
   */
  autoFit?: boolean;
  /**
   * Keep the toolbar out of sight until the pointer is over the diagram, for
   * the same host and the same reason as `autoFit`. See `REVEAL_ON_HOVER`.
   *
   * The toolbar floats over the bottom of the diagram. In a window that costs
   * a strip of empty canvas; in a 500px frame it covers the bottom fifth of the
   * thing the page put there to be looked at, and on a narrow one it wraps to
   * two rows and covers a third. The shortcuts keep working while it is hidden
   * — `F`, `L` and `D` are bound to the document, not to these buttons.
   *
   * The group this reveals from is on `DiagramViewer`'s `main`, because the
   * search bar hides with the toolbar and is not inside this component.
   */
  revealControlsOnHover?: boolean;
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
  hostActions = null,
  autoFit = false,
  revealControlsOnHover = false,
}: DiagramWrapperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<null | CoreStage>(null);
  const isSelectMode = useIsSelectMode();
  // The Group the tables live in. A pointer position read from it is already in
  // the coordinates `tableCoordsStore` holds — the stage transform and this
  // Group's own offset included — so nothing here has to undo either.
  const tablesGroupRef = useRef<null | CoreGroup>(null);
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  // Where the drag began, and whether the modifier was down when it did: the
  // reader may let Shift go halfway through, and the gesture they started is
  // the one they meant.
  const marqueeStartRef = useRef<{
    x: number;
    y: number;
    additive: boolean;
  } | null>(null);
  // Konva has no filter for which mouse button starts a drag, so panning inside
  // select mode is the stage being made draggable for the length of one gesture
  // and put back afterwards.
  const [isPanOverride, setIsPanOverride] = useState(false);
  const isMiddleButtonDownRef = useRef(false);
  const { height: viewHeight, width: viewWidth } = useElementSize(containerRef);
  const { scrollDirection } = useScrollDirectionContext();
  // Konva is written to directly on pan and zoom, so this is the only thing
  // that can tell the rest of the app the view moved.
  const publishViewport = useCallback((): void => {
    const stage = stageRef.current;
    if (stage === null) {
      return;
    }

    viewportStore.set({
      scale: stage.scaleX(),
      x: stage.x(),
      y: stage.y(),
      width: stage.width(),
      height: stage.height(),
    });
  }, []);

  const { onChange: onGrabbing, onRestore: onGrabRelease } =
    useCursorChanger("grabbing");
  const themeColors = useThemeColors();

  const { detailLevel, next: nextDetailLevel } = useTableDetailLevel();
  // Read through a ref rather than closed over: `fitToView` is captured once,
  // by the mount-time subscription below, and a captured detail level would be
  // whatever it was when the document opened for the rest of the document's
  // life.
  const detailLevelRef = useRef(detailLevel);
  detailLevelRef.current = detailLevel;

  const diagramBounds = (): {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null =>
    computeDiagramBounds(
      tableCoordsStore.getCurrentStore(),
      tablesMeta,
      detailLevelRef.current,
    );

  const fitToView = () => {
    if (stageRef.current != null) {
      const stage = stageRef.current;
      const container = stage.container();
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      // `diagramBounds` rather than the stage: see `computeDiagramBounds` for
      // why the stage is the wrong thing to measure and why the stored heights
      // are not the right ones either.
      const contentBounds =
        diagramBounds() ?? stage.getClientRect({ relativeTo: stage });
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
      // After the position, never between it and the scale: a viewport
      // published half-updated culls against a rectangle that never existed,
      // and every table disappears.
      publishViewport();
    }
  };

  // repositioning the stage: once for most hosts, on every resize for the one
  // that asked to be kept framed
  const { scale: defaultStageScale, position: defaultStagePosition } =
    useStageStartingState({ width: viewWidth, height: viewHeight });
  const hasPositionedStage = useRef(false);
  useEffect(() => {
    // Only after there is a real size to fit into.
    if (stageRef.current === null || viewWidth === 0 || viewHeight === 0) {
      return;
    }

    // A host that asked to be kept framed gets the same measurement the
    // toolbar's fit button makes, rather than the starting state: the starting
    // state takes its bounds from table coordinates alone, so a table's own
    // width and height fall outside the box it computes, and the rightmost one
    // is cut off by however wide it happens to be.
    //
    // Ahead of the once-only guard, because for this host the resizes are the
    // point — see `autoFit`.
    if (autoFit) {
      hasPositionedStage.current = true;
      // Fits and publishes the viewport itself.
      fitToView();
      return;
    }

    // Once, for everyone else. The starting state depends on the container's
    // dimensions, so without this guard every resize — a dragged divider most of
    // all — would reposition the diagram and throw away the reader's pan.
    // Panning is not persisted, so there would be nothing to restore it from.
    //
    // And the starting state is not something to override even once here:
    // `useStageStartingState` returns a view the reader left behind when there
    // is one, and replacing it would drop them somewhere they did not ask to be,
    // every time they came back to a document.
    if (hasPositionedStage.current) {
      return;
    }

    hasPositionedStage.current = true;

    stageRef.current.scale({
      x: defaultStageScale,
      y: defaultStageScale,
    });
    stageRef.current.position(defaultStagePosition);
    publishViewport();
  }, [
    defaultStageScale,
    defaultStagePosition,
    viewWidth,
    viewHeight,
    publishViewport,
    autoFit,
  ]);

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
    publishViewport();
  }, [scrollDirection, publishViewport]);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (
        event.key !== "Escape" ||
        selectionStore.getSelected().size === 0 ||
        // The one definition of "the reader is busy with this key" — see
        // `isTypingTarget`. Escape in the editor beside the diagram means
        // "dismiss what you are showing me", not "drop my selection".
        isTypingTarget(event.target as TypingTarget | null)
      ) {
        return;
      }

      // Marked as spent, the way the legend and the export menu mark theirs:
      // the embedded frame reads exactly this to decide whether an Escape was
      // the reader asking for the page back. Without it one keypress would both
      // drop the selection and collapse an expanded frame.
      event.preventDefault();
      selectionStore.clear();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    // An unmount cleanup rather than a watch on the document key: this
    // component does not receive the key, and remounting is exactly what a
    // document change does to it. Without this, opening another schema leaves a
    // selection naming tables that are not on the canvas.
    return () => {
      selectionStore.clear();
    };
  }, []);

  useEffect(() => {
    if (!isSelectMode) {
      // A selection that outlived the mode would silently change what a plain
      // drag does, in the mode whose whole point is that a drag moves the
      // canvas. Panning stays reachable inside select mode, so nobody has to
      // leave it mid-task.
      selectionStore.clear();
    }
  }, [isSelectMode]);

  useEffect(() => {
    if (!isSelectMode) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (
        event.code !== "Space" ||
        isSpaceActivatedTarget(event.target as TypingTarget | null)
      ) {
        return;
      }

      // Otherwise the page around an embedded frame scrolls a screen down while
      // the reader is holding the key to pan.
      event.preventDefault();
      setIsPanOverride(true);
    };

    const onKeyUp = (event: KeyboardEvent): void => {
      if (event.code === "Space") {
        setIsPanOverride(false);
      }
    };

    // A reader who switches windows mid-pan never sends the key-up.
    const onBlur = (): void => {
      setIsPanOverride(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      setIsPanOverride(false);
    };
  }, [isSelectMode]);

  const pointerInDiagram = (): { x: number; y: number } | null =>
    tablesGroupRef.current?.getRelativePointerPosition() ?? null;

  const handleMarqueeStart = (event: KonvaEventObject<MouseEvent>): void => {
    // Only a drag that began on empty canvas. One that began on a table is that
    // table being moved, which Konva is already handling.
    if (event.target !== stageRef.current) {
      return;
    }

    const point = pointerInDiagram();

    if (point === null) {
      return;
    }

    marqueeStartRef.current = { ...point, additive: event.evt.shiftKey };
    setMarquee({ x: point.x, y: point.y, w: 0, h: 0 });
  };

  const handleMarqueeMove = (): void => {
    const start = marqueeStartRef.current;
    const point = pointerInDiagram();

    if (start === null || point === null) {
      return;
    }

    setMarquee({
      x: start.x,
      y: start.y,
      w: point.x - start.x,
      h: point.y - start.y,
    });
  };

  /** What the stage's `draggable` prop says it should be right now. */
  const stageIsDraggable = !isSelectMode || isPanOverride;

  /**
   * Ends whatever gesture was in flight, whichever way it ended.
   *
   * One function for both gestures and bound to every way a drag can stop —
   * the button coming up, the pointer leaving the canvas, the window losing
   * focus. A middle-button pan released outside the canvas used to send no
   * mouse-up at all, so its flag stayed raised and the stage stayed draggable:
   * select mode silently became pan mode, and the next drag both drew a marquee
   * and moved the canvas.
   *
   * `draggable` is restored to what the prop says rather than to `false`.
   * Konva is being written to directly here, and React will not re-apply a prop
   * whose value has not changed — so hardcoding `false` left the stage
   * undraggable while the reader was still holding space for it.
   */
  const endGesture = (): void => {
    if (isMiddleButtonDownRef.current) {
      isMiddleButtonDownRef.current = false;
      stageRef.current?.stopDrag();
      stageRef.current?.draggable(stageIsDraggable);
    }

    const start = marqueeStartRef.current;

    if (start === null) {
      return;
    }

    const point = pointerInDiagram();
    const box: Marquee =
      point === null
        ? { x: start.x, y: start.y, w: 0, h: 0 }
        : {
            x: start.x,
            y: start.y,
            w: point.x - start.x,
            h: point.y - start.y,
          };

    selectionStore.setSelected(
      selectionFromMarquee(
        tableCoordsStore.getCurrentStore(),
        box,
        start.additive,
        selectionStore.getSelected(),
      ),
    );

    marqueeStartRef.current = null;
    setMarquee(null);
  };

  // Bound once, and read at the moment the gesture ends, so the listener below
  // never needs re-attaching.
  const endGestureRef = useRef(endGesture);
  endGestureRef.current = endGesture;

  useEffect(() => {
    // On the window rather than on the stage, which is the whole point: Konva
    // captures the pointer for the length of a stage drag, so the stage hears
    // no `mouseleave` and — if the button comes up outside the canvas — no
    // `mouseup` either. Listening here is the only way to be told the gesture
    // is over wherever it ended. `blur` covers the reader switching apps
    // mid-drag, which sends no pointer event at all.
    const onEnd = (): void => {
      endGestureRef.current();
    };

    window.addEventListener("mouseup", onEnd);
    window.addEventListener("blur", onEnd);

    return () => {
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("blur", onEnd);
    };
  }, []);

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
    // `fitToView` reads nothing but `stageRef`, constants and refs, so the copy
    // captured here stays correct for the life of the component.
  }, []);

  /**
   * A different amount of table gets an arrangement of its own.
   *
   * The layout is computed from how tall the tables are drawn — the gaps
   * between them are a share of their height, and the number of columns the
   * diagram is broken into is chosen to bring the whole near `TARGET_ASPECT`.
   * None of that survives the tables becoming a fortieth of their height, so
   * headers left in a full-detail arrangement sit in a field of white with the
   * relations running the length of it.
   *
   * `switchToDetailLevel` re-keys the store to this level and either recovers
   * the arrangement the reader last had here or computes one. Announcing the
   * coordinates as replaced is what moves the tables; the subscription above
   * hears that too and would eventually frame them, but only on the next
   * animation frame, and a frame that is off-screen or in a background tab is
   * not given one. The framing is called for here instead, where it is
   * immediate and certain — nothing is waited for, because the bounds are read
   * from the coordinate store rather than measured off the stage.
   *
   * The guard keeps this off the mount, where it would arrange a document that
   * `switchDocument` has just arranged and take away the view a returning
   * reader left behind. The viewer is keyed by document, so a document switch
   * mounts a fresh one and lands here too.
   */
  const arrangedAtDetailLevel = useRef(detailLevel);
  useEffect(() => {
    if (arrangedAtDetailLevel.current === detailLevel) {
      return;
    }

    arrangedAtDetailLevel.current = detailLevel;
    tableCoordsStore.switchToDetailLevel(tablesMeta, refs);
    fitToView();
  }, [detailLevel, tablesMeta, refs]);

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
      interactionMode: toggleInteractionMode,
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
    <div
      ref={containerRef}
      // The reader has to be told the mode is temporarily something else, or
      // holding space looks like the marquee has broken. The middle button
      // needs no cursor of its own: `useCursorChanger("grabbing")` is already
      // wired to the stage's drag events, which a middle-button pan goes
      // through.
      className={`relative h-full w-full overflow-hidden ${
        isSelectMode && isPanOverride ? "cursor-grab" : ""
      }`}
    >
      <Stage
        draggable={!isSelectMode || isPanOverride}
        ref={stageRef}
        onDragStart={onGrabbing}
        onDragMove={publishViewport}
        onDragEnd={onGrabRelease}
        onWheel={handleZooming}
        onMouseDown={(event) => {
          handleStagePointerDown(event);

          if (!isSelectMode) {
            return;
          }

          // Space is held, so the stage is already draggable and Konva is
          // about to pan with this very drag. Opening a marquee on top of it
          // would end by committing an empty one: the tables move with the
          // stage, so the pointer barely moves relative to them, and the box
          // `endGesture` computes catches nothing — which clears the selection
          // the reader held space to keep.
          if (isPanOverride) {
            return;
          }

          // 1 is the middle button. Konva cannot be told which buttons drag,
          // so the stage is made draggable for the length of this gesture and
          // `endGesture` puts it back.
          if (event.evt.button === 1) {
            isMiddleButtonDownRef.current = true;
            stageRef.current?.draggable(true);
            stageRef.current?.startDrag();
            return;
          }

          handleMarqueeStart(event);
        }}
        onMouseMove={isSelectMode ? handleMarqueeMove : undefined}
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
          <Group
            ref={tablesGroupRef}
            offsetX={-DIAGRAM_PADDING}
            offsetY={-DIAGRAM_PADDING}
          >
            {tables}
          </Group>
        </Layer>

        {marquee !== null && (
          // Its own layer, above the tables: the marquee is drawn over whatever
          // it is catching. Deaf to the pointer, so the rectangle under it
          // cannot swallow the mouse-up that ends the gesture.
          <Layer listening={false}>
            <Group offsetX={-DIAGRAM_PADDING} offsetY={-DIAGRAM_PADDING}>
              <Rect
                x={normalizeMarquee(marquee).x}
                y={normalizeMarquee(marquee).y}
                width={normalizeMarquee(marquee).w}
                height={normalizeMarquee(marquee).h}
                fill={themeColors.selection.fill}
                opacity={0.25}
                stroke={themeColors.selection.stroke}
                // Divided by the scale so the outline stays a hairline however
                // far out the reader has zoomed.
                strokeWidth={1 / (stageRef.current?.scaleX() ?? 1)}
                dash={[4, 3]}
              />
            </Group>
          </Layer>
        )}
      </Stage>

      {/* A plain wrapper, with no positioning of its own, so the toolbar inside
          still anchors to the container above rather than to this. */}
      <div className={revealControlsOnHover ? REVEAL_ON_HOVER : ""}>
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
          hostActions={hostActions}
        />
      </div>

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
