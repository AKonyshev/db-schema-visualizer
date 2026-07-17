import type { CanonIndex, CanonRef, SchemaDiff } from "./model";

const refLabel = (r: CanonRef): string =>
  `${r.fromTable}(${r.fromColumns.join(", ")}) → ${r.toTable}(${r.toColumns.join(", ")})`;

const indexLabel = (i: CanonIndex): string => `(${i.columns.join(", ")})`;

export function renderDiffMarkdown(diff: SchemaDiff): string {
  const out: string[] = ["# Schema comparison: DBML model vs database", ""];

  if (diff.identical) {
    out.push("✅ Schemas are identical.");
    return out.join("\n");
  }

  const bullet = (items: string[], header: string): void => {
    if (items.length === 0) return;
    out.push(`## ${header} (${items.length})`, "");
    for (const i of items) out.push(`- ${i}`);
    out.push("");
  };

  bullet(diff.tablesOnlyInDbml, "Tables only in DBML");
  bullet(diff.tablesOnlyInDatabase, "Tables only in database");

  if (diff.columnDiffs.length > 0) {
    out.push(`## Column differences (${diff.columnDiffs.length} tables)`, "");
    for (const t of diff.columnDiffs) {
      out.push(`### ${t.table}`, "");
      for (const c of t.onlyInDbml) out.push(`- \`${c}\` — only in DBML`);
      for (const c of t.onlyInDatabase)
        out.push(`- \`${c}\` — only in database`);
      for (const ch of t.changed) {
        const parts = ch.differs
          .map((d) => {
            if (d === "type")
              return `type: DBML \`${ch.model.type}\` vs DB \`${ch.database.type}\``;
            if (d === "nullable")
              return `nullable: DBML \`${ch.model.nullable}\` vs DB \`${ch.database.nullable}\``;
            return `pk: DBML \`${ch.model.pk}\` vs DB \`${ch.database.pk}\``;
          })
          .join("; ");
        out.push(`- \`${ch.column}\` — ${parts}`);
      }
      out.push("");
    }
  }

  bullet(diff.enumsOnlyInDbml, "Enums only in DBML");
  bullet(diff.enumsOnlyInDatabase, "Enums only in database");

  if (diff.enumValueDiffs.length > 0) {
    out.push(`## Enum value differences (${diff.enumValueDiffs.length})`, "");
    for (const e of diff.enumValueDiffs) {
      const bits: string[] = [];
      if (e.onlyInDbml.length > 0)
        bits.push(`only in DBML: ${e.onlyInDbml.join(", ")}`);
      if (e.onlyInDatabase.length > 0)
        bits.push(`only in database: ${e.onlyInDatabase.join(", ")}`);
      out.push(`- \`${e.enumName}\` — ${bits.join("; ")}`);
    }
    out.push("");
  }

  bullet(diff.refsOnlyInDbml.map(refLabel), "Foreign keys only in DBML");
  bullet(
    diff.refsOnlyInDatabase.map(refLabel),
    "Foreign keys only in database",
  );

  if (diff.indexDiffs.length > 0) {
    out.push(`## Index differences (${diff.indexDiffs.length} tables)`, "");
    for (const t of diff.indexDiffs) {
      out.push(`### ${t.table}`, "");
      for (const i of t.onlyInDbml)
        out.push(`- ${indexLabel(i)} — only in DBML`);
      for (const i of t.onlyInDatabase)
        out.push(`- ${indexLabel(i)} — only in database`);
      out.push("");
    }
  }

  return out.join("\n");
}
