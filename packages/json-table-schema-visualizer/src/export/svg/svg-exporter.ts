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
  // Every layer, not the first one. The diagram draws its relations on one and
  // its tables on another — they were one layer until the zoom rewrite split
  // them — and recording only `getLayers()[0]` produced an SVG holding the
  // relation lines and no tables at all. It looked like a working export right
  // up until somebody opened the file.
  const layers = stage.getLayers();
  const oldContexts = layers.map((layer) => layer.canvas.context._context);

  await sleep(200);

  const oldContext = oldContexts[0];
  const oldPosition = stage.getAbsolutePosition();
  const oldScale = stage.getAbsoluteScale();

  const scaleFactor = 0.6;
  const xywhCoords = tableCoordsStore.getXYWHCoords();
  stage.position({
    x: -xywhCoords.x * scaleFactor,
    y: -xywhCoords.y * scaleFactor,
  });
  stage.scale({ x: scaleFactor, y: scaleFactor });

  const c2s = new Context({
    height: (xywhCoords.h + DIAGRAM_PADDING * 2) * scaleFactor,
    width: (xywhCoords.w + DIAGRAM_PADDING * 2) * scaleFactor,
    ctx: oldContext,
  });

  // Konva's layer wants a real CanvasRenderingContext2D here. The shim covers
  // the older 2D surface Konva actually calls and nothing beyond it, so this
  // asserts a compatibility the type system cannot check. Keeping the assertion
  // at this one line is the point: declaring the shim as a full
  // CanvasRenderingContext2D instead would hand the same false promise to every
  // future caller. See svgcanvas.esm.d.ts.
  layers.forEach((layer) => {
    layer.canvas.context._context = c2s as unknown as CanvasRenderingContext2D;
  });

  // Draws the layers in order, so what the reader sees behind what, the file
  // keeps.
  stage.draw();

  const svg = c2s.getSerializedSvg();

  const out: string | Blob = blob
    ? new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
    : svg;

  layers.forEach((layer, index) => {
    layer.canvas.context._context = oldContexts[index];
  });
  stage.position(oldPosition);
  stage.scale(oldScale);

  await sleep(200);
  stage.draw();

  return out;
}
