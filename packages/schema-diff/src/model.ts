export interface CanonColumn {
  name: string;
  type: string;
  nullable: boolean;
  pk: boolean;
}

export interface CanonIndex {
  columns: string[];
  unique: boolean;
  name?: string;
}

export interface CanonTable {
  schema: string;
  name: string;
  columns: Map<string, CanonColumn>;
  indexes: CanonIndex[];
}

export interface CanonEnum {
  name: string;
  values: string[];
}

export interface CanonRef {
  fromTable: string;
  fromColumns: string[];
  toTable: string;
  toColumns: string[];
}

export interface CanonSchema {
  tables: Map<string, CanonTable>;
  enums: Map<string, CanonEnum>;
  refs: CanonRef[];
}

export interface ColumnChange {
  column: string;
  model: CanonColumn;
  database: CanonColumn;
  differs: Array<"type" | "nullable" | "pk">;
}

export interface TableColumnDiff {
  table: string;
  onlyInDbml: string[];
  onlyInDatabase: string[];
  changed: ColumnChange[];
}

export interface EnumValueDiff {
  enumName: string;
  onlyInDbml: string[];
  onlyInDatabase: string[];
}

export interface IndexDiff {
  table: string;
  onlyInDbml: CanonIndex[];
  onlyInDatabase: CanonIndex[];
}

export interface SchemaDiff {
  tablesOnlyInDbml: string[];
  tablesOnlyInDatabase: string[];
  columnDiffs: TableColumnDiff[];
  enumsOnlyInDbml: string[];
  enumsOnlyInDatabase: string[];
  enumValueDiffs: EnumValueDiff[];
  refsOnlyInDbml: CanonRef[];
  refsOnlyInDatabase: CanonRef[];
  indexDiffs: IndexDiff[];
  identical: boolean;
}
