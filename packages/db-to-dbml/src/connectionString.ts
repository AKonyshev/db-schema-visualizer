import { DbImportError, DbImportErrorCode } from "./errors";

// One guard for every entry point that takes a connection string. It returns
// the trimmed value, so a caller passes on exactly what was validated rather
// than trimming again on its own.
export function assertPostgresConnectionString(value: string): string {
  const trimmed = value.trim();
  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    throw new DbImportError(
      DbImportErrorCode.INVALID_CONNECTION_STRING,
      "Connection string must start with postgres:// or postgresql://",
    );
  }
  return trimmed;
}

// A saved connection names a server; the database inside it is only the entry
// point. Switching databases is therefore a path rewrite — and the credentials,
// the host and every query parameter (`?sslmode=require` decides whether the
// connection is encrypted at all) have to survive it untouched.
export function withDatabase(
  connectionString: string,
  databaseName: string,
): string {
  const url = new URL(assertPostgresConnectionString(connectionString));
  url.pathname = `/${encodeURIComponent(databaseName)}`;
  return url.toString();
}
