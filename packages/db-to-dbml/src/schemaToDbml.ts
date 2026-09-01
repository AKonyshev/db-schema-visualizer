import { importer } from "@dbml/core";

import { filterDatabaseSchema } from "./filterDatabaseSchema";

import type { DatabaseSchema } from "./types";

export function schemaToDbml(
  db: DatabaseSchema,
  schemaNames: string[],
): { dbml: string; droppedCrossSchemaRefs: number } {
  const { schema, droppedCrossSchemaRefs } = filterDatabaseSchema(
    db,
    schemaNames,
  );
  const dbml: string = importer.generateDbml(schema);
  return { dbml, droppedCrossSchemaRefs };
}
