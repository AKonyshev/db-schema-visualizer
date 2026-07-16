import { canonicalizeType } from "../canonicalizeType";

describe("canonicalizeType", () => {
  test("maps integer synonyms", () => {
    expect(canonicalizeType("int4")).toBe("integer");
    expect(canonicalizeType("INTEGER")).toBe("integer");
    expect(canonicalizeType("int")).toBe("integer");
  });

  test("strips length/precision", () => {
    expect(canonicalizeType("varchar(150)")).toBe("varchar");
    expect(canonicalizeType("numeric(10,2)")).toBe("numeric");
  });

  test("maps spelled-out synonyms with spaces", () => {
    expect(canonicalizeType("timestamp with time zone")).toBe("timestamptz");
    expect(canonicalizeType("character varying")).toBe("varchar");
    expect(canonicalizeType("bool")).toBe("boolean");
    expect(canonicalizeType("decimal")).toBe("numeric");
  });

  test("passes through unknown types after normalizing", () => {
    expect(canonicalizeType("  UUID ")).toBe("uuid");
    expect(canonicalizeType("jsonb")).toBe("jsonb");
  });
});
