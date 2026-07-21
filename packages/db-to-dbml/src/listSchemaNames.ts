import type { DatabaseSchema } from "./types";

export function listSchemaNames(db: DatabaseSchema): string[] {
  const names = new Set<string>();
  (db.tables ?? []).forEach((t) => names.add(t.schemaName));
  (db.enums ?? []).forEach((e) => names.add(e.schemaName));
  return [...names].sort();
}
