import { ScrollDirection } from "@/types/scrollDirection";

/** Minimum / maximum stage scale while zooming with the wheel. */
export const WHEEL_ZOOM_MIN_SCALE = 0.05;
export const WHEEL_ZOOM_MAX_SCALE = 10;

// Tuned so a single mouse-wheel notch (~100px deltaY) is close to the previous
// fixed 2% step, while trackpad deltas accumulate smoothly when coalesced.
const WHEEL_SCALE_SENSITIVITY = 0.002;

export interface WheelZoomInput {
  oldScale: number;
  deltaY: number;
  ctrlKey: boolean;
  scrollDirection: ScrollDirection;
  pointerX: number;
  pointerY: number;
  stageX: number;
  stageY: number;
}

export interface WheelZoomResult {
  scale: number;
  position: { x: number; y: number };
}

/**
 * Zoom the stage toward the pointer, preserving the point under the cursor.
 *
 * Pure so wheel coalescing and pointer-relative math can be tested without a
 * canvas.
 */
export const computeWheelZoom = ({
  oldScale,
  deltaY,
  ctrlKey,
  scrollDirection,
  pointerX,
  pointerY,
  stageX,
  stageY,
}: WheelZoomInput): WheelZoomResult => {
  if (deltaY === 0) {
    return { scale: oldScale, position: { x: stageX, y: stageY } };
  }

  const mousePointTo = {
    x: (pointerX - stageX) / oldScale,
    y: (pointerY - stageY) / oldScale,
  };

  let direction = 0;
  if (scrollDirection === ScrollDirection.UpOut) {
    direction = deltaY > 0 ? 1 : -1;
  } else if (scrollDirection === ScrollDirection.UpIn) {
    direction = deltaY > 0 ? -1 : 1;
  }

  if (ctrlKey) {
    direction = -direction;
  }

  const signedDelta = direction * Math.abs(deltaY);
  const scaleFactor = Math.exp(signedDelta * WHEEL_SCALE_SENSITIVITY);
  const scale = Math.min(
    WHEEL_ZOOM_MAX_SCALE,
    Math.max(WHEEL_ZOOM_MIN_SCALE, oldScale * scaleFactor),
  );

  return {
    scale,
    position: {
      x: pointerX - mousePointTo.x * scale,
      y: pointerY - mousePointTo.y * scale,
    },
  };
};
