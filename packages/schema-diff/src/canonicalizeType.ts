const SYNONYMS: Record<string, string> = {
  int4: "integer",
  int: "integer",
  integer: "integer",
  int8: "bigint",
  bigint: "bigint",
  int2: "smallint",
  smallint: "smallint",
  bool: "boolean",
  boolean: "boolean",
  timestamptz: "timestamptz",
  "timestamp with time zone": "timestamptz",
  timestamp: "timestamp",
  "timestamp without time zone": "timestamp",
  varchar: "varchar",
  "character varying": "varchar",
  bpchar: "char",
  char: "char",
  character: "char",
  numeric: "numeric",
  decimal: "numeric",
  float8: "double precision",
  "double precision": "double precision",
  float4: "real",
  real: "real",
};

export function canonicalizeType(raw: string): string {
  let t = raw.trim().toLowerCase();
  t = t.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return SYNONYMS[t] ?? t;
}
