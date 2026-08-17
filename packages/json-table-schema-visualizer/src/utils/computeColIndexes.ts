import { filterByDetailLevel } from "./filterByDetailLevel";

import type { ColsIndexesMap } from "@/types//tablesInfoProviderValue";
import type { JSONTableTable } from "shared/types/tableSchema";

import { TableDetailLevel } from "@/types/tableDetailLevel";

/**
 * Where each column sits inside its table, keyed `table.column`.
 *
 * Built by assignment rather than by spreading an accumulator. The spread
 * version copied the whole map once per column, which is quadratic: on a
 * 117-table, 5,676-column schema it took ~100 ms, and it ran on every render of
 * the provider that owns it — that is, on every mouse move onto a table.
 */
export const computeColIndexes = (
  tables: JSONTableTable[],
  detailLevel: TableDetailLevel,
): ColsIndexesMap => {
  if (detailLevel === TableDetailLevel.HeaderOnly) {
    return {};
  }

  const indexes: ColsIndexesMap = {};

  for (const table of tables) {
    filterByDetailLevel(table.fields, detailLevel).forEach((field, index) => {
      indexes[computeColIndexesKey(table.name, field.name)] = index;
    });
  }

  return indexes;
};

export const computeColIndexesKey = (
  tableName: string,
  attr: string,
): string => {
  return `${tableName}.${attr}`;
};
