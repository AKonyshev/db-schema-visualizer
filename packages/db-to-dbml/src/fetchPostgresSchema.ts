import { fetchSchemaJson } from "@dbml/connector/dist/connectors/postgresConnector";

import { DbImportError, DbImportErrorCode, toDbImportError } from "./errors";

import type { DatabaseSchema } from "./types";

export async function fetchPostgresSchema(
  connectionString: string,
): Promise<DatabaseSchema> {
  const trimmed = connectionString.trim();
  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    throw new DbImportError(
      DbImportErrorCode.INVALID_CONNECTION_STRING,
      "Connection string must start with postgres:// or postgresql://",
    );
  }

  try {
    return (await fetchSchemaJson(trimmed)) as unknown as DatabaseSchema;
  } catch (err) {
    throw toDbImportError(err);
  }
}
