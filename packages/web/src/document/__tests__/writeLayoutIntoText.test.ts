import { METAINFO_END, METAINFO_START } from "dbml-to-json-table-schema";

import { writeLayoutIntoText } from "../writeLayoutIntoText";

const SCHEMA = "Table users {\n  id integer [pk]\n}\n";
const COORDS = [{ name: "users", x: 120, y: 40 }];

const blockCount = (text: string): number =>
  text.split(METAINFO_START).length - 1;

describe("writing the table layout into DBML text", () => {
  // The decision this wrapper exists to make. Pressing the button before there
  // is a diagram would otherwise append a block saying nothing.
  test("leaves the text untouched when nothing is arranged", () => {
    expect(writeLayoutIntoText(SCHEMA, [])).toBe(SCHEMA);
  });

  test("appends a block when the text has none", () => {
    const written = writeLayoutIntoText(SCHEMA, COORDS);

    expect(written.startsWith(SCHEMA)).toBe(true);
    expect(written).toContain(METAINFO_START);
    expect(written).toContain(METAINFO_END);
    expect(written).toContain('"users"');
  });

  // Replaced in place rather than appended again: a schema that accumulated one
  // block per save would grow without bound, and only one of them could be right.
  test("replaces the block in place when the text already has one", () => {
    const once = writeLayoutIntoText(SCHEMA, COORDS);
    const twice = writeLayoutIntoText(once, [
      { name: "users", x: 900, y: 900 },
    ]);

    expect(blockCount(once)).toBe(1);
    expect(blockCount(twice)).toBe(1);
    expect(twice).toContain("900");
    expect(twice).not.toContain("120");
  });

  test("keeps the schema above the block intact when rewriting it", () => {
    const once = writeLayoutIntoText(SCHEMA, COORDS);
    const twice = writeLayoutIntoText(once, [
      { name: "users", x: 900, y: 900 },
    ]);

    expect(twice.startsWith(SCHEMA)).toBe(true);
  });

  // The format is the contract with the extension, so this asserts the shape a
  // reader of the file would see rather than merely that something was written.
  test("writes coordinates the extension's own reader would recognise", () => {
    const written = writeLayoutIntoText(SCHEMA, COORDS);
    const body = written.slice(
      written.indexOf(METAINFO_START) + METAINFO_START.length,
      written.indexOf(METAINFO_END),
    );

    expect(JSON.parse(body.trim())).toEqual([{ name: "users", x: 120, y: 40 }]);
  });

  // Positions arrive from a drag, so they are fractional; the file should not be.
  test("rounds the positions a drag leaves behind", () => {
    const written = writeLayoutIntoText(SCHEMA, [
      { name: "users", x: 120.4, y: 40.6 },
    ]);

    expect(written).toContain('"x":120');
    expect(written).toContain('"y":41');
  });
});
