export interface SchemaScoped {
  schemaName: string;
  [key: string]: unknown;
}

export interface RefEndpoint {
  schemaName: string;
  tableName: string;
  [key: string]: unknown;
}

export interface Ref {
  endpoints: RefEndpoint[];
  [key: string]: unknown;
}

// The @dbml/connector output may omit sections entirely (observed: `checks`
// is absent for a database with no check constraints), so every section is
// optional. Consumers must treat a missing section as empty.
export interface DatabaseSchema {
  tables?: Array<SchemaScoped & { name: string }>;
  enums?: Array<SchemaScoped & { name: string }>;
  refs?: Ref[];
  fields?: Record<string, unknown>;
  tableConstraints?: Record<string, unknown>;
  indexes?: Record<string, unknown>;
  checks?: Record<string, unknown>;
}
