import { DbImportError, DbImportErrorCode } from "db-to-dbml";

// Record over the enum, so adding a DbImportErrorCode without deciding on its
// UI string is a compile error rather than a silent fall-through to the
// caller's generic fallback. `null` means "no specific string, use the
// fallback". Never include error.message here — it may carry connection
// details (see toDbImportError in db-to-dbml).
const UI_MESSAGES: Record<DbImportErrorCode, string | null> = {
  [DbImportErrorCode.AUTH_FAILED]:
    "Authentication failed. Check the username and password.",
  [DbImportErrorCode.INVALID_CONNECTION_STRING]:
    "Invalid PostgreSQL connection string.",
  [DbImportErrorCode.UNREACHABLE]: "Could not reach the database host.",
  [DbImportErrorCode.DATABASE_NOT_FOUND]:
    "The specified database does not exist.",
  [DbImportErrorCode.UNKNOWN]: null,
};

export function dbImportErrorMessage(
  error: DbImportError,
  unknownFallback: string,
): string {
  return UI_MESSAGES[error.code] ?? unknownFallback;
}
