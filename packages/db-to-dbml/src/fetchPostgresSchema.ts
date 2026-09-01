import { fetchSchemaJson } from "@dbml/connector/dist/connectors/postgresConnector";

import { assertPostgresConnectionString } from "./connectionString";
import { toDbImportError } from "./errors";

import type { DatabaseSchema } from "./types";

export async function fetchPostgresSchema(
  connectionString: string,
): Promise<DatabaseSchema> {
  const trimmed = assertPostgresConnectionString(connectionString);

  try {
    return (await fetchSchemaJson(trimmed)) as unknown as DatabaseSchema;
  } catch (err) {
    throw toDbImportError(err);
  }
}
