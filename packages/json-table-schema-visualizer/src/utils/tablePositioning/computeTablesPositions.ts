import dagre from "@dagrejs/dagre";

import { computeTableDimension } from "../computeTableDimension";

import { getLayoutEdges } from "./getLayoutEdges";
import { isDegenerateShape, shelfPack } from "./shelfPack";

import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";

import { TABLES_GAP_X, TABLES_GAP_Y } from "@/constants/sizing";
import { type XYWHPosition } from "@/types/positions";

const computeTablesPositions = (
  tables: JSONTableTable[],
  refs: JSONTableRef[],
): Map<string, XYWHPosition> => {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    nodesep: TABLES_GAP_X * 3,
    ranksep: TABLES_GAP_Y * 3,
    rankdir: "LR",
  });
  graph.setDefaultEdgeLabel(function () {
    return {};
  });

  tables.forEach((table) => {
    const { height, width } = computeTableDimension(table);
    graph.setNode(table.name, { width, height });
  });

  getLayoutEdges(tables, refs).forEach(([source, target]) => {
    graph.setEdge(source, target);
  });

  dagre.layout(graph);

  const rawPositions: Array<{ name: string; x: number; y: number }> = [];

  graph.nodes().forEach((node) => {
    const nodeData = graph.node(node);
    if (nodeData == null) return;
    const width = !isNaN(nodeData.width) ? nodeData.width : 0;
    const height = !isNaN(nodeData.height) ? nodeData.height : 0;
    const topLeftX = nodeData.x - width / 2;
    const topLeftY = nodeData.y - height / 2;
    rawPositions.push({ name: node, x: topLeftX, y: topLeftY });
  });

  if (rawPositions.length === 0) {
    return new Map<string, XYWHPosition>();
  }

  const dimensionOf = (name: string): { width: number; height: number } => {
    const table = tables.find((t) => t.name === name);

    return table != null
      ? computeTableDimension(table)
      : { width: 0, height: 0 };
  };

  // Dagre packs a rank along one axis only, so a schema whose tables mostly
  // share a rank comes out as a strip: this one was 1,650 wide and 146,586
  // tall, which fit-to-view can only answer by shrinking everything to nothing.
  // A strip is never the shape a diagram wants, so when it happens the tables
  // are re-laid in rows — keeping dagre's order, which is what puts related
  // tables beside each other, and discarding only its placement.
  const spread = (positions: typeof rawPositions): { w: number; h: number } => {
    const xs = positions.map((pos) => pos.x);
    const ys = positions.map((pos) => pos.y);
    const rights = positions.map((pos) => pos.x + dimensionOf(pos.name).width);
    const bottoms = positions.map(
      (pos) => pos.y + dimensionOf(pos.name).height,
    );

    return {
      w: Math.max(...rights) - Math.min(...xs),
      h: Math.max(...bottoms) - Math.min(...ys),
    };
  };

  const { w: laidOutWidth, h: laidOutHeight } = spread(rawPositions);

  let positions = rawPositions;
  if (isDegenerateShape(laidOutWidth, laidOutHeight)) {
    const inReadingOrder = [...rawPositions].sort((a, b) =>
      a.y === b.y ? a.x - b.x : a.y - b.y,
    );

    positions = shelfPack(
      inReadingOrder.map((pos) => {
        const { width, height } = dimensionOf(pos.name);

        return { name: pos.name, w: width, h: height };
      }),
    ).map((box) => ({ name: box.name, x: box.x, y: box.y }));
  }

  const minX = Math.min(...positions.map((pos) => pos.x));
  const minY = Math.min(...positions.map((pos) => pos.y));

  const paddingX = TABLES_GAP_X;
  const paddingY = TABLES_GAP_Y;

  const tablesPositions = new Map<string, XYWHPosition>();
  positions.forEach((pos) => {
    const { width, height } = dimensionOf(pos.name);
    tablesPositions.set(pos.name, {
      x: pos.x - minX + paddingX,
      y: pos.y - minY + paddingY,
      w: width,
      h: height,
    });
  });

  return tablesPositions;
};

export default computeTablesPositions;
