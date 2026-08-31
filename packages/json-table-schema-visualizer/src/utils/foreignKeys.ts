import {
  type JSONTableRef,
  type JSONTableTable,
} from "shared/types/tableSchema";
import { computeRelationalFieldKey } from "shared/utils/computeRelationalFieldKey";

/**
 * Which columns on this diagram are foreign keys.
 *
 * Not something a field carries: `is_relation` is set on both ends of every
 * relation, so it says a column takes part in one, not which side of it the
 * constraint lives on. The answer is in the relation itself.
 *
 * Two rules, and a refusal:
 *
 * - The endpoint whose relation is `*` is the many side, and the many side is
 *   where the key is. That covers `<` and `>`, which is nearly every relation
 *   anyone writes.
 * - A one-to-one relation (`-`) makes both endpoints `1` and so says nothing.
 *   The column that is its own table's primary key is the one being pointed at,
 *   which leaves the other one holding the key.
 * - When that does not separate them either — two primary keys, as in table
 *   inheritance, or two ordinary columns — neither is marked. A badge on the
 *   wrong column is a worse answer than no badge, because the reader has no way
 *   to tell it is wrong.
 *
 * Returned as keys from `computeRelationalFieldKey`, the same shape
 * `relational_tables` is built on.
 */
export const computeForeignKeyFields = (
  tables: JSONTableTable[],
  refs: JSONTableRef[],
): Set<string> => {
  const primaryKeys = new Set<string>();

  for (const table of tables) {
    for (const field of table.fields) {
      if (field.pk === true) {
        primaryKeys.add(computeRelationalFieldKey(table.name, field.name));
      }
    }
  }

  // A table the diagram does not hold is a relation whose other end was
  // filtered out — the embedded frame draws a slice of a model. Its columns are
  // not on the canvas to be marked, and nothing can be said about which side of
  // a relation to a missing table carries the key.
  const drawn = new Set(tables.map((table) => table.name));
  const foreignKeys = new Set<string>();

  for (const ref of refs) {
    const endpoints = ref.endpoints.filter((endpoint) =>
      drawn.has(endpoint.tableName),
    );

    if (endpoints.length !== 2) {
      continue;
    }

    const keys = endpoints.map((endpoint) =>
      computeRelationalFieldKey(endpoint.tableName, endpoint.fieldNames[0]),
    );

    const manySide = endpoints.findIndex(
      (endpoint) => endpoint.relation === "*",
    );

    if (manySide !== -1) {
      foreignKeys.add(keys[manySide]);
      continue;
    }

    const notPrimary = keys.filter((key) => !primaryKeys.has(key));

    if (notPrimary.length === 1) {
      foreignKeys.add(notPrimary[0]);
    }
  }

  return foreignKeys;
};
