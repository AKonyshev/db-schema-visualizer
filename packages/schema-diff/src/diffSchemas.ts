import { indexKey, refKey } from "./util";

import type {
  CanonSchema,
  ColumnChange,
  EnumValueDiff,
  IndexDiff,
  SchemaDiff,
  TableColumnDiff,
} from "./model";

const onlyIn = (a: Iterable<string>, b: Set<string>): string[] =>
  [...a].filter((x) => !b.has(x)).sort();

const commonSorted = (a: Set<string>, b: Set<string>): string[] =>
  [...a].filter((x) => b.has(x)).sort();

export function diffSchemas(
  model: CanonSchema,
  database: CanonSchema,
): SchemaDiff {
  const mTables = new Set(model.tables.keys());
  const dTables = new Set(database.tables.keys());

  const tablesOnlyInDbml = onlyIn(mTables, dTables);
  const tablesOnlyInDatabase = onlyIn(dTables, mTables);

  const columnDiffs: TableColumnDiff[] = [];
  const indexDiffs: IndexDiff[] = [];
  for (const table of commonSorted(mTables, dTables)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const mCols = model.tables.get(table)!.columns;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dCols = database.tables.get(table)!.columns;
    const mColNames = new Set(mCols.keys());
    const dColNames = new Set(dCols.keys());

    const changed: ColumnChange[] = [];
    for (const name of commonSorted(mColNames, dColNames)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const m = mCols.get(name)!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const d = dCols.get(name)!;
      const differs: Array<"type" | "nullable" | "pk"> = [];
      if (m.type !== d.type) differs.push("type");
      if (m.nullable !== d.nullable) differs.push("nullable");
      if (m.pk !== d.pk) differs.push("pk");
      if (differs.length > 0) {
        changed.push({ column: name, model: m, database: d, differs });
      }
    }
    const onlyInDbml = onlyIn(mColNames, dColNames);
    const onlyInDatabase = onlyIn(dColNames, mColNames);
    if (
      onlyInDbml.length > 0 ||
      onlyInDatabase.length > 0 ||
      changed.length > 0
    ) {
      columnDiffs.push({ table, onlyInDbml, onlyInDatabase, changed });
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const mIx = new Map(
      model.tables.get(table)!.indexes.map((i) => [indexKey(i), i]),
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dIx = new Map(
      database.tables.get(table)!.indexes.map((i) => [indexKey(i), i]),
    );
    const ixOnlyDbml = [...mIx].filter(([k]) => !dIx.has(k)).map(([, i]) => i);
    const ixOnlyDb = [...dIx].filter(([k]) => !mIx.has(k)).map(([, i]) => i);
    if (ixOnlyDbml.length > 0 || ixOnlyDb.length > 0) {
      indexDiffs.push({
        table,
        onlyInDbml: ixOnlyDbml,
        onlyInDatabase: ixOnlyDb,
      });
    }
  }

  const mEnums = new Set(model.enums.keys());
  const dEnums = new Set(database.enums.keys());
  const enumsOnlyInDbml = onlyIn(mEnums, dEnums);
  const enumsOnlyInDatabase = onlyIn(dEnums, mEnums);
  const enumValueDiffs: EnumValueDiff[] = [];
  for (const enumName of commonSorted(mEnums, dEnums)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const mv = new Set(model.enums.get(enumName)!.values);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dv = new Set(database.enums.get(enumName)!.values);
    const onlyInDbml = onlyIn(mv, dv);
    const onlyInDatabase = onlyIn(dv, mv);
    if (onlyInDbml.length > 0 || onlyInDatabase.length > 0) {
      enumValueDiffs.push({ enumName, onlyInDbml, onlyInDatabase });
    }
  }

  const mRefs = new Map(model.refs.map((r) => [refKey(r), r]));
  const dRefs = new Map(database.refs.map((r) => [refKey(r), r]));
  const refsOnlyInDbml = [...mRefs]
    .filter(([k]) => !dRefs.has(k))
    .map(([, r]) => r);
  const refsOnlyInDatabase = [...dRefs]
    .filter(([k]) => !mRefs.has(k))
    .map(([, r]) => r);

  const identical =
    tablesOnlyInDbml.length === 0 &&
    tablesOnlyInDatabase.length === 0 &&
    columnDiffs.length === 0 &&
    enumsOnlyInDbml.length === 0 &&
    enumsOnlyInDatabase.length === 0 &&
    enumValueDiffs.length === 0 &&
    refsOnlyInDbml.length === 0 &&
    refsOnlyInDatabase.length === 0 &&
    indexDiffs.length === 0;

  return {
    tablesOnlyInDbml,
    tablesOnlyInDatabase,
    columnDiffs,
    enumsOnlyInDbml,
    enumsOnlyInDatabase,
    enumValueDiffs,
    refsOnlyInDbml,
    refsOnlyInDatabase,
    indexDiffs,
    identical,
  };
}
