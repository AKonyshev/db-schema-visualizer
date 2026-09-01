import type { DatabaseSchema } from "./types";

// The real @dbml/connector output does not always include every dictionary
// (e.g. `checks` is absent when a database has no check constraints), and an
// array can be missing too, so treat any nullish section as empty.
const pickBySchemas = (
  dict: Record<string, unknown> | undefined,
  prefixes: string[],
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(dict ?? {}).filter(([key]) =>
      prefixes.some((prefix) => key.startsWith(prefix)),
    ),
  );

export function filterDatabaseSchema(
  db: DatabaseSchema,
  schemaNames: string[],
): { schema: Required<DatabaseSchema>; droppedCrossSchemaRefs: number } {
  const selected = new Set(schemaNames);
  const prefixes = schemaNames.map((name) => `${name}.`);

  const tables = (db.tables ?? []).filter((t) => selected.has(t.schemaName));
  const enums = (db.enums ?? []).filter((e) => selected.has(e.schemaName));

  // A reference survives when the whole of it was selected. One that leaves the
  // selection cannot be drawn — nothing in the file holds its other end — so it
  // is dropped and counted, and the user is told how many.
  let droppedCrossSchemaRefs = 0;
  const refs = (db.refs ?? []).filter((ref) => {
    const allInside = ref.endpoints.every((e) => selected.has(e.schemaName));
    const anyInside = ref.endpoints.some((e) => selected.has(e.schemaName));
    if (!allInside && anyInside) droppedCrossSchemaRefs += 1;
    return allInside;
  });

  return {
    schema: {
      tables,
      enums,
      refs,
      fields: pickBySchemas(db.fields, prefixes),
      tableConstraints: pickBySchemas(db.tableConstraints, prefixes),
      indexes: pickBySchemas(db.indexes, prefixes),
      checks: pickBySchemas(db.checks, prefixes),
    },
    droppedCrossSchemaRefs,
  };
}
