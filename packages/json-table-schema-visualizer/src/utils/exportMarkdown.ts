import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";

import { t } from "@/i18n/t";

// A sibling of generateAsciiDoc rather than a shared generator parameterised by
// syntax: the two share a structure but differ on almost every line of markup,
// so a common core would take more parameters than it saves.
//
// Identifiers are written verbatim. A `|` in a table or column name would break
// the Markdown table, but it cannot appear in a SQL identifier, and inventing an
// escape for an input nobody has is guesswork.
export const generateMarkdown = (
  tables: JSONTableTable[],
  refs: JSONTableRef[],
): string => {
  let markdown = `## ${t("md.title")}\n\n`;

  tables.forEach((table) => {
    markdown += `### ${table.name}\n\n`;
    markdown += `${table.note ?? t("md.noDescription")}\n\n`;
    markdown += `${t("md.columns")}\n`;
    // Without this row the columns render as plain text instead of a table.
    markdown += "| --- | --- | --- |\n";

    table.fields.forEach((field) => {
      markdown += `| ${field.name} | ${field.type.type_name} | ${field.note ?? ""} |\n`;
    });

    markdown += "\n";

    const tableRefs = refs.filter(
      (ref) =>
        ref.endpoints[0].tableName === table.name ||
        ref.endpoints[1].tableName === table.name,
    );

    if (tableRefs.length > 0) {
      markdown += `#### ${t("md.relations")}\n\n`;
      tableRefs.forEach((relation) => {
        markdown += `- ${relation.endpoints[0].fieldNames.join(", ")} -> ${relation.endpoints[1].tableName}.${relation.endpoints[1].fieldNames.join(", ")}\n`;
      });
      markdown += "\n";
    }

    markdown += "---\n\n";
  });

  return markdown;
};
