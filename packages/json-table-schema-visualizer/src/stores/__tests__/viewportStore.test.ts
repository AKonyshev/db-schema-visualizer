import {
  rectsIntersect,
  viewportStore,
  visibleWorldRect,
} from "../viewportStore";

describe("visibleWorldRect", () => {
  test("converts the stage transform into world coordinates", () => {
    // A 1000x500 stage at 2x, panned so the world origin sits at screen 100,50.
    const rect = visibleWorldRect(
      { scale: 2, x: 100, y: 50, width: 1000, height: 500 },
      0,
    );

    expect(rect).toEqual({ x: -50, y: -25, w: 500, h: 250 });
  });

  test("grows by the margin on every side", () => {
    const rect = visibleWorldRect(
      { scale: 1, x: 0, y: 0, width: 100, height: 100 },
      0.5,
    );

    // Half a viewport each way: 100 wide becomes 200, starting 50 earlier.
    expect(rect).toEqual({ x: -50, y: -50, w: 200, h: 200 });
  });

  test("refuses to guess before the stage has a size", () => {
    expect(
      visibleWorldRect({ scale: 1, x: 0, y: 0, width: 0, height: 0 }, 0.5),
    ).toBeNull();
  });
});

describe("rectsIntersect", () => {
  const view = { x: 0, y: 0, w: 100, h: 100 };

  test("accepts a table inside the view", () => {
    expect(rectsIntersect({ x: 10, y: 10, w: 10, h: 10 }, view)).toBe(true);
  });

  test("accepts a table straddling an edge", () => {
    expect(rectsIntersect({ x: -5, y: 50, w: 10, h: 10 }, view)).toBe(true);
  });

  test("rejects a table beyond every edge", () => {
    expect(rectsIntersect({ x: 200, y: 0, w: 10, h: 10 }, view)).toBe(false);
    expect(rectsIntersect({ x: 0, y: -50, w: 10, h: 10 }, view)).toBe(false);
  });

  test("rejects a table merely touching the edge", () => {
    expect(rectsIntersect({ x: 100, y: 0, w: 10, h: 10 }, view)).toBe(false);
  });
});

describe("viewportStore", () => {
  test("stays quiet when the view has not actually moved", () => {
    viewportStore.set({ scale: 1, x: 0, y: 0, width: 10, height: 10 });

    let calls = 0;
    const stop = viewportStore.subscribe(() => {
      calls++;
    });

    viewportStore.set({ scale: 1, x: 0, y: 0, width: 10, height: 10 });
    expect(calls).toBe(0);

    viewportStore.set({ scale: 1, x: 1, y: 0, width: 10, height: 10 });
    expect(calls).toBe(1);

    stop();
    viewportStore.reset();
  });
});
