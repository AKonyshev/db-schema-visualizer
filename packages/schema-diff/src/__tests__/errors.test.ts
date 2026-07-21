import { DbmlParseError } from "../errors";

describe("DbmlParseError", () => {
  test("carries line and column", () => {
    const e = new DbmlParseError("bad syntax", 12, 5);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("DbmlParseError");
    expect(e.message).toBe("bad syntax");
    expect(e.line).toBe(12);
    expect(e.column).toBe(5);
  });
});
