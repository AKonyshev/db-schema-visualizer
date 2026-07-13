import { DbImportError, DbImportErrorCode, toDbImportError } from "../errors";

describe("toDbImportError", () => {
  test("maps postgres auth failure 28P01", () => {
    const e = toDbImportError({
      code: "28P01",
      message: "password authentication failed",
    });
    expect(e).toBeInstanceOf(DbImportError);
    expect(e.code).toBe(DbImportErrorCode.AUTH_FAILED);
  });

  test("maps unreachable host codes", () => {
    for (const code of ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND"]) {
      expect(toDbImportError({ code }).code).toBe(
        DbImportErrorCode.UNREACHABLE,
      );
    }
  });

  test("maps missing database 3D000", () => {
    expect(toDbImportError({ code: "3D000" }).code).toBe(
      DbImportErrorCode.DATABASE_NOT_FOUND,
    );
  });

  test("falls back to UNKNOWN", () => {
    expect(toDbImportError(new Error("boom")).code).toBe(
      DbImportErrorCode.UNKNOWN,
    );
  });

  test("passing a DbImportError through is unchanged", () => {
    const original = new DbImportError(
      DbImportErrorCode.INVALID_CONNECTION_STRING,
      "bad",
    );
    expect(toDbImportError(original)).toBe(original);
  });
});
