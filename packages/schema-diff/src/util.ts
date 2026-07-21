import type { CanonIndex, CanonRef } from "./model";

export function splitQualified(
  name: string,
  schemaName: string | null | undefined,
): { schema: string; table: string } {
  if (schemaName != null && schemaName !== "") {
    return { schema: schemaName, table: name };
  }
  const idx = name.indexOf(".");
  return idx === -1
    ? { schema: "", table: name }
    : { schema: name.slice(0, idx), table: name.slice(idx + 1) };
}

interface RawEndpoint {
  tableName: string;
  schemaName?: string | null;
  fieldNames?: string[];
}

export function endpointsToRef(endpoints: RawEndpoint[]): CanonRef {
  const a = endpoints[0];
  const b = endpoints[1];
  return {
    fromTable: splitQualified(a.tableName, a.schemaName).table,
    fromColumns: (a.fieldNames ?? []).map(String),
    toTable: splitQualified(b.tableName, b.schemaName).table,
    toColumns: (b.fieldNames ?? []).map(String),
  };
}

export function refKey(r: CanonRef): string {
  const a = `${r.fromTable}(${[...r.fromColumns].sort().join(",")})`;
  const b = `${r.toTable}(${[...r.toColumns].sort().join(",")})`;
  return [a, b].sort().join("--");
}

export function indexKey(i: CanonIndex): string {
  return [...i.columns].sort().join(",");
}
