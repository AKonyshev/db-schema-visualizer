export enum DbImportErrorCode {
  INVALID_CONNECTION_STRING = "INVALID_CONNECTION_STRING",
  AUTH_FAILED = "AUTH_FAILED",
  UNREACHABLE = "UNREACHABLE",
  DATABASE_NOT_FOUND = "DATABASE_NOT_FOUND",
  UNKNOWN = "UNKNOWN",
}

export class DbImportError extends Error {
  public readonly code: DbImportErrorCode;

  constructor(code: DbImportErrorCode, message: string) {
    super(message);
    this.name = "DbImportError";
    this.code = code;
  }
}

export function toDbImportError(err: unknown): DbImportError {
  if (err instanceof DbImportError) return err;

  const code = (err as { code?: string })?.code;

  switch (code) {
    case "28P01":
      return new DbImportError(
        DbImportErrorCode.AUTH_FAILED,
        "Authentication failed",
      );
    case "3D000":
      return new DbImportError(
        DbImportErrorCode.DATABASE_NOT_FOUND,
        "Database does not exist",
      );
    case "ECONNREFUSED":
    case "ETIMEDOUT":
    case "ENOTFOUND":
      return new DbImportError(
        DbImportErrorCode.UNREACHABLE,
        "Could not reach the database host",
      );
    default:
      return new DbImportError(
        DbImportErrorCode.UNKNOWN,
        "Failed to import schema from the database",
      );
  }
}
