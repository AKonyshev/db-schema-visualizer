import { DbImportError, DbImportErrorCode } from "db-to-dbml";

export function dbImportErrorMessage(
  error: DbImportError,
  unknownFallback: string,
): string {
  if (error.code === DbImportErrorCode.AUTH_FAILED) {
    return "Authentication failed. Check the username and password.";
  }
  if (error.code === DbImportErrorCode.INVALID_CONNECTION_STRING) {
    return "Invalid PostgreSQL connection string.";
  }
  if (error.code === DbImportErrorCode.UNREACHABLE) {
    return "Could not reach the database host.";
  }
  if (error.code === DbImportErrorCode.DATABASE_NOT_FOUND) {
    return "The specified database does not exist.";
  }
  return unknownFallback;
}
