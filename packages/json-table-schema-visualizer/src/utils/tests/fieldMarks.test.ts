import { type JSONTableField } from "shared/types/tableSchema";

import {
  badgeLayout,
  computeFieldMarks,
  fieldTypeText,
  MANDATORY_MARK,
} from "../fieldMarks";

jest.mock("../computeTextSize", () => ({
  computeTextSize: jest.fn((text: string) => ({
    width: text.length,
    height: 10,
  })),
}));

const field = (over: Partial<JSONTableField> = {}): JSONTableField => ({
  name: "id",
  type: { type_name: "uuid", is_enum: false },
  is_relation: false,
  ...over,
});

describe("computeFieldMarks", () => {
  it("marks an ordinary nullable column with nothing at all", () => {
    expect(computeFieldMarks(field(), false)).toEqual({
      typeName: "uuid",
      mandatory: false,
      badges: [],
    });
  });

  it("marks a NOT NULL column as mandatory", () => {
    expect(computeFieldMarks(field({ not_null: true }), false).mandatory).toBe(
      true,
    );
  });

  it("badges the keys in a fixed order", () => {
    expect(computeFieldMarks(field({ pk: true }), true).badges).toEqual([
      "PK",
      "FK",
    ]);
  });

  it("badges a foreign key on its own", () => {
    expect(computeFieldMarks(field(), true).badges).toEqual(["FK"]);
  });

  it("badges a unique column", () => {
    expect(computeFieldMarks(field({ unique: true }), false).badges).toEqual([
      "UK",
    ]);
  });

  it("does not tell the reader a primary key is unique", () => {
    // True, and not worth a badge: every primary key is unique, so the pair
    // says nothing the first badge did not and costs the width of a second.
    expect(
      computeFieldMarks(field({ pk: true, unique: true }), false).badges,
    ).toEqual(["PK"]);
  });
});

describe("fieldTypeText", () => {
  it("is the type alone when the column may be null", () => {
    expect(fieldTypeText(computeFieldMarks(field(), false))).toBe("uuid");
  });

  it("carries the mandatory mark when it may not", () => {
    expect(
      fieldTypeText(computeFieldMarks(field({ not_null: true }), false)),
    ).toBe(`uuid ${MANDATORY_MARK}`);
  });
});

describe("badgeLayout totals", () => {
  it("is nothing for a column with no badges", () => {
    expect(badgeLayout([]).totalWidth).toBe(0);
  });

  it("grows with each badge", () => {
    expect(badgeLayout(["PK", "FK"]).totalWidth).toBeGreaterThan(
      badgeLayout(["PK"]).totalWidth,
    );
  });

  it("counts the pill and not only the letters in it", () => {
    // The mocked measurer returns one unit per character, so a bare "PK" would
    // be 2. Anything at that number means the padding the pill is drawn with
    // was left out of the width the table is laid out at, and the badge would
    // hang over the edge of the box.
    expect(badgeLayout(["PK"]).totalWidth).toBeGreaterThan(2);
  });
});

describe("badgeLayout", () => {
  it("is empty for a column with no badges", () => {
    expect(badgeLayout([])).toEqual({ totalWidth: 0, pills: [] });
  });

  it("lays the pills out left to right without overlap", () => {
    const { pills } = badgeLayout(["PK", "FK"]);

    expect(pills.map((pill) => pill.badge)).toEqual(["PK", "FK"]);
    expect(pills[1].x).toBeGreaterThanOrEqual(pills[0].x + pills[0].width);
  });

  it("keeps every pill inside the width it reserved", () => {
    // The one invariant: what the table was laid out for and what the renderer
    // draws are the same number. Apart, the last pill hangs over the edge.
    for (const badges of [["PK"], ["PK", "FK"], ["PK", "FK", "UK"]] as const) {
      const layout = badgeLayout([...badges]);
      const last = layout.pills[layout.pills.length - 1];

      expect(last.x + last.width).toBeLessThanOrEqual(layout.totalWidth);
    }
  });

  it("measures each label once however often it is asked for", () => {
    // Called for every column on every render, and the measurer clones a Konva
    // node. There are three possible labels and one font size, so the answer
    // cannot change between calls.
    const measure = jest.requireMock("../computeTextSize")
      .computeTextSize as jest.Mock;

    badgeLayout(["PK", "FK", "UK"]);
    measure.mockClear();
    badgeLayout(["PK", "FK", "UK"]);

    expect(measure).not.toHaveBeenCalled();
  });
});
