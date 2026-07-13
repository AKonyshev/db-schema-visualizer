import type { DatabaseSchema } from "./types";

const pickByPrefix = (
  dict: Record<string, unknown>,
  prefix: string,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(dict).filter(([key]) => key.startsWith(prefix)),
  );

export function filterDatabaseSchema(
  db: DatabaseSchema,
  schemaName: string,
): { schema: DatabaseSchema; droppedCrossSchemaRefs: number } {
  const prefix = `${schemaName}.`;

  const tables = db.tables.filter((t) => t.schemaName === schemaName);
  const enums = db.enums.filter((e) => e.schemaName === schemaName);

  let droppedCrossSchemaRefs = 0;
  const refs = db.refs.filter((ref) => {
    const allInSchema = ref.endpoints.every((e) => e.schemaName === schemaName);
    const anyInSchema = ref.endpoints.some((e) => e.schemaName === schemaName);
    if (!allInSchema && anyInSchema) droppedCrossSchemaRefs += 1;
    return allInSchema;
  });

  return {
    schema: {
      tables,
      enums,
      refs,
      fields: pickByPrefix(db.fields, prefix),
      tableConstraints: pickByPrefix(db.tableConstraints, prefix),
      indexes: pickByPrefix(db.indexes, prefix),
      checks: pickByPrefix(db.checks, prefix),
    },
    droppedCrossSchemaRefs,
  };
}
