import { computeWheelZoom } from "../computeWheelZoom";

import { ScrollDirection } from "@/types/scrollDirection";

const baseInput = {
  oldScale: 1,
  pointerX: 200,
  pointerY: 150,
  stageX: 0,
  stageY: 0,
  scrollDirection: ScrollDirection.UpOut,
  ctrlKey: false,
};

describe("computeWheelZoom", () => {
  test("leaves scale unchanged when deltaY is zero", () => {
    const result = computeWheelZoom({ ...baseInput, deltaY: 0 });

    expect(result.scale).toBe(1);
    expect(result.position).toEqual({ x: 0, y: 0 });
  });

  test("zooms in toward the pointer on scroll down in UpOut mode", () => {
    const result = computeWheelZoom({ ...baseInput, deltaY: 100 });

    expect(result.scale).toBeGreaterThan(1);
    expect(result.position.x).toBeLessThan(0);
    expect(result.position.y).toBeLessThan(0);
  });

  test("zooms out on scroll up in UpOut mode", () => {
    const result = computeWheelZoom({ ...baseInput, deltaY: -100 });

    expect(result.scale).toBeLessThan(1);
  });

  test("reverses direction when ctrlKey is set (trackpad pinch)", () => {
    const withoutCtrl = computeWheelZoom({ ...baseInput, deltaY: 100 });
    const withCtrl = computeWheelZoom({
      ...baseInput,
      deltaY: 100,
      ctrlKey: true,
    });

    expect(withCtrl.scale).toBeLessThan(withoutCtrl.scale);
  });

  test("keeps the pointer anchor stable across the zoom", () => {
    const before = { x: 400, y: 300 };
    const result = computeWheelZoom({
      oldScale: 0.8,
      deltaY: 120,
      ctrlKey: false,
      scrollDirection: ScrollDirection.UpOut,
      pointerX: before.x,
      pointerY: before.y,
      stageX: 50,
      stageY: -30,
    });

    const worldX = (before.x - 50) / 0.8;
    const worldY = (before.y + 30) / 0.8;
    const afterX = (before.x - result.position.x) / result.scale;
    const afterY = (before.y - result.position.y) / result.scale;

    expect(afterX).toBeCloseTo(worldX, 5);
    expect(afterY).toBeCloseTo(worldY, 5);
  });
});
