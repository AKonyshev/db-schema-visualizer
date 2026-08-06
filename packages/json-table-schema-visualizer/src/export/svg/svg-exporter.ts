import { type Stage } from "konva/lib/Stage";

import { Context } from "./svgcanvas.esm.js";

import { DIAGRAM_PADDING } from "@/constants/sizing";
import { tableCoordsStore } from "@/stores/tableCoords";

export const sleep = async (time: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, time));
};

export async function exportStageSVG(
  stage: Stage,
  blob = false,
): Promise<string | Blob> {
  const layer = stage.getLayers()[0];

  await sleep(200);

  const oldContext = layer.canvas.context._context;
  const oldPosition = stage.getAbsolutePosition();
  const oldScale = stage.getAbsoluteScale();

  const scaleFactor = 0.6;
  const xywhCoords = tableCoordsStore.getXYWHCoords();
  stage.position({
    x: -xywhCoords.x * scaleFactor,
    y: -xywhCoords.y * scaleFactor,
  });
  stage.scale({ x: scaleFactor, y: scaleFactor });

  const c2s = (layer.canvas.context._context = new Context({
    height: (xywhCoords.h + DIAGRAM_PADDING * 2) * scaleFactor,
    width: (xywhCoords.w + DIAGRAM_PADDING * 2) * scaleFactor,
    ctx: oldContext,
  }));

  stage.draw();

  const svg = c2s.getSerializedSvg();

  const out: string | Blob = blob
    ? new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
    : svg;

  layer.canvas.context._context = oldContext;
  stage.position(oldPosition);
  stage.scale(oldScale);

  await sleep(200);
  stage.draw();

  return out;
}
