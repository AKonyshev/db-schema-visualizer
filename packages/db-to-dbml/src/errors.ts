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

// The @dbml/connector postgres submodule catches connection-phase errors and
// re-throws `new Error(\`PostgreSQL connection error: ${err}\`)`, which drops
// the original `.code`. When that happens we fall back to matching on the
// (still-original, un-redacted-by-us) message text. We only ever MATCH on the
// incoming message here — we never echo/interpolate it into the returned
// error, since it may contain connection details.
function inferCodeFromMessage(message: string): DbImportErrorCode {
  if (/password authentication failed/i.test(message)) {
    return DbImportErrorCode.AUTH_FAILED;
  }
  if (/database .* does not exist/i.test(message)) {
    return DbImportErrorCode.DATABASE_NOT_FOUND;
  }
  if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|getaddrinfo/i.test(message)) {
    return DbImportErrorCode.UNREACHABLE;
  }
  return DbImportErrorCode.UNKNOWN;
}

function dbImportErrorForCode(code: DbImportErrorCode): DbImportError {
  switch (code) {
    case DbImportErrorCode.AUTH_FAILED:
      return new DbImportError(
        DbImportErrorCode.AUTH_FAILED,
        "Authentication failed",
      );
    case DbImportErrorCode.DATABASE_NOT_FOUND:
      return new DbImportError(
        DbImportErrorCode.DATABASE_NOT_FOUND,
        "Database does not exist",
      );
    case DbImportErrorCode.UNREACHABLE:
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

export function toDbImportError(err: unknown): DbImportError {
  if (err instanceof DbImportError) return err;

  const code = (err as { code?: string })?.code;

  switch (code) {
    case "28P01":
      return dbImportErrorForCode(DbImportErrorCode.AUTH_FAILED);
    case "3D000":
      return dbImportErrorForCode(DbImportErrorCode.DATABASE_NOT_FOUND);
    case "ECONNREFUSED":
    case "ETIMEDOUT":
    case "ENOTFOUND":
      return dbImportErrorForCode(DbImportErrorCode.UNREACHABLE);
    default: {
      const message = (err as { message?: string })?.message ?? "";
      return dbImportErrorForCode(inferCodeFromMessage(message));
    }
  }
}
