import type { CanonIndex, CanonRef, SchemaDiff } from "./model";

/**
 * Translator with `{0}`-style placeholders, matching the VS Code l10n contract.
 * Injected rather than imported so this package keeps no editor dependency and
 * stays testable as a plain function.
 */
export type TranslateFn = (
  message: string,
  ...args: Array<string | number | boolean>
) => string;

const substituteOnly: TranslateFn = (message, ...args) =>
  args.reduce<string>(
    (acc, arg, index) => acc.replace(`{${index}}`, String(arg)),
    message,
  );

const refLabel = (r: CanonRef): string =>
  `${r.fromTable}(${r.fromColumns.join(", ")}) → ${r.toTable}(${r.toColumns.join(", ")})`;

const indexLabel = (i: CanonIndex): string => `(${i.columns.join(", ")})`;

export function renderDiffMarkdown(
  diff: SchemaDiff,
  t: TranslateFn = substituteOnly,
): string {
  const out: string[] = [
    `# ${t("Schema comparison: DBML model vs database")}`,
    "",
  ];

  if (diff.identical) {
    out.push(`✅ ${t("Schemas are identical.")}`);
    return out.join("\n");
  }

  const onlyInDbml = t("only in DBML");
  const onlyInDatabase = t("only in database");

  const bullet = (items: string[], header: string): void => {
    if (items.length === 0) return;
    out.push(`## ${header} (${items.length})`, "");
    for (const i of items) out.push(`- ${i}`);
    out.push("");
  };

  bullet(diff.tablesOnlyInDbml, t("Tables only in DBML"));
  bullet(diff.tablesOnlyInDatabase, t("Tables only in database"));

  if (diff.columnDiffs.length > 0) {
    out.push(
      `## ${t("Column differences ({0} tables)", diff.columnDiffs.length)}`,
      "",
    );
    for (const tbl of diff.columnDiffs) {
      out.push(`### ${tbl.table}`, "");
      for (const c of tbl.onlyInDbml) out.push(`- \`${c}\` — ${onlyInDbml}`);
      for (const c of tbl.onlyInDatabase)
        out.push(`- \`${c}\` — ${onlyInDatabase}`);
      for (const ch of tbl.changed) {
        const parts = ch.differs
          .map((d) => {
            if (d === "type")
              return t(
                "type: DBML `{0}` vs DB `{1}`",
                ch.model.type,
                ch.database.type,
              );
            if (d === "nullable")
              return t(
                "nullable: DBML `{0}` vs DB `{1}`",
                ch.model.nullable,
                ch.database.nullable,
              );
            return t("pk: DBML `{0}` vs DB `{1}`", ch.model.pk, ch.database.pk);
          })
          .join("; ");
        out.push(`- \`${ch.column}\` — ${parts}`);
      }
      out.push("");
    }
  }

  bullet(diff.enumsOnlyInDbml, t("Enums only in DBML"));
  bullet(diff.enumsOnlyInDatabase, t("Enums only in database"));

  if (diff.enumValueDiffs.length > 0) {
    out.push(
      `## ${t("Enum value differences ({0})", diff.enumValueDiffs.length)}`,
      "",
    );
    for (const e of diff.enumValueDiffs) {
      const bits: string[] = [];
      if (e.onlyInDbml.length > 0)
        bits.push(t("only in DBML: {0}", e.onlyInDbml.join(", ")));
      if (e.onlyInDatabase.length > 0)
        bits.push(t("only in database: {0}", e.onlyInDatabase.join(", ")));
      out.push(`- \`${e.enumName}\` — ${bits.join("; ")}`);
    }
    out.push("");
  }

  bullet(diff.refsOnlyInDbml.map(refLabel), t("Foreign keys only in DBML"));
  bullet(
    diff.refsOnlyInDatabase.map(refLabel),
    t("Foreign keys only in database"),
  );

  if (diff.indexDiffs.length > 0) {
    out.push(
      `## ${t("Index differences ({0} tables)", diff.indexDiffs.length)}`,
      "",
    );
    for (const tbl of diff.indexDiffs) {
      out.push(`### ${tbl.table}`, "");
      for (const i of tbl.onlyInDbml)
        out.push(`- ${indexLabel(i)} — ${onlyInDbml}`);
      for (const i of tbl.onlyInDatabase)
        out.push(`- ${indexLabel(i)} — ${onlyInDatabase}`);
      out.push("");
    }
  }

  return out.join("\n");
}
