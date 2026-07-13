import { importer } from "@dbml/core";

import { filterDatabaseSchema } from "./filterDatabaseSchema";

import type { DatabaseSchema } from "./types";

export function schemaToDbml(
  db: DatabaseSchema,
  schemaName: string,
): { dbml: string; droppedCrossSchemaRefs: number } {
  const { schema, droppedCrossSchemaRefs } = filterDatabaseSchema(
    db,
    schemaName,
  );
  const dbml: string = importer.generateDbml(schema);
  return { dbml, droppedCrossSchemaRefs };
}
