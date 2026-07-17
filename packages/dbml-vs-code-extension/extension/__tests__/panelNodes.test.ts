import { buildConnectionNodes } from "../panelNodes";

describe("buildConnectionNodes", () => {
  test("returns one connection node per name", () => {
    expect(buildConnectionNodes(["a", "b"])).toEqual([
      { kind: "connection", name: "a" },
      { kind: "connection", name: "b" },
    ]);
  });

  test("returns a single empty node when there are no connections", () => {
    expect(buildConnectionNodes([])).toEqual([
      { kind: "empty", label: "No saved connections" },
    ]);
  });
});
