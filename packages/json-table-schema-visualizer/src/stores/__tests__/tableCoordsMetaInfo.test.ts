import { detailLevelStore } from "../detailLevelStore";
import { tableCoordsStore } from "../tableCoords";

import type { JSONTableField, JSONTableTable } from "shared/types/tableSchema";

import { TableDetailLevel } from "@/types/tableDetailLevel";

jest.mock("@/utils/computeTextSize", () => ({
  computeTextSize: jest.fn((text: string) => ({
    width: text.length * 8,
    height: 10,
  })),
}));

const fakeStorage = (): Storage => {
  const items = new Map<string, string>();

  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
    removeItem: (key: string) => {
      items.delete(key);
    },
    clear: () => {
      items.clear();
    },
    key: (index: number) => [...items.keys()][index] ?? null,
    get length() {
      return items.size;
    },
  } as unknown as Storage;
};

const tableFrom = (
  name: string,
  columns: number,
  fromFile?: { x: number; y: number; detailLevel: string },
): JSONTableTable =>
  ({
    name,
    fields: Array.from(
      { length: columns },
      (_, i) =>
        ({
          name: `c${i}`,
          type: { type_name: "integer", is_enum: false },
          is_relation: false,
        }) as unknown as JSONTableField,
    ),
    indexes: [],
    x: fromFile?.x ?? 0,
    y: fromFile?.y ?? 0,
    fromMetaInfo: fromFile !== undefined,
    fromMetaInfoDetailLevel: fromFile?.detailLevel,
  }) as unknown as JSONTableTable;

describe("the layout a file is given, and the one it is read back from", () => {
  // A document key per case. The store is a singleton and carries the previous
  // case's map into the next one, where saving it under a key that case then
  // reads would hand it back a layout it never made.
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: fakeStorage(),
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: fakeStorage(),
      configurable: true,
    });
  });

  test("offers the arrangement in hand, saying which level it was made at", () => {
    detailLevelStore.set(TableDetailLevel.HeaderOnly);
    tableCoordsStore.switchTo("doc-offered", [tableFrom("t", 80)], []);

    const entries = tableCoordsStore.getCoordEntriesForMetaInfo();

    // Moving a table about with only the headers showing is an arrangement like
    // any other, and it goes into the file like any other — carrying the level
    // it was made at, which is what makes it safe to read back.
    expect(entries).toEqual([
      expect.objectContaining({
        name: "t",
        detailLevel: TableDetailLevel.HeaderOnly,
      }),
    ]);
  });

  test("uses a file's coordinates when they were arranged for the level in force", () => {
    detailLevelStore.set(TableDetailLevel.HeaderOnly);
    tableCoordsStore.switchTo(
      "doc-same-level",
      [tableFrom("t", 80, { x: 4242, y: 2424, detailLevel: "HeaderOnly" })],
      [],
    );

    expect(tableCoordsStore.getFullCoords("t")).toEqual(
      expect.objectContaining({ x: 4242, y: 2424 }),
    );
  });

  test("passes over a file's coordinates arranged for another level", () => {
    detailLevelStore.set(TableDetailLevel.FullDetails);
    tableCoordsStore.switchTo(
      "doc-other-level",
      [tableFrom("t", 80, { x: 4242, y: 2424, detailLevel: "HeaderOnly" })],
      [],
    );

    // Eighty rows of table laid out on coordinates spaced for eighty headers is
    // eighty rows of table on top of the next one along.
    expect(tableCoordsStore.getFullCoords("t").x).not.toBe(4242);
  });
});
