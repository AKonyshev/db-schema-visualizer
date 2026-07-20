import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";

import { t } from "@/i18n/t";

export const generateAsciiDoc = (
  tables: JSONTableTable[],
  refs: JSONTableRef[],
): string => {
  let asciiDoc = `== ${t("adoc.title")}\n`;

  tables.forEach((table) => {
    asciiDoc += `=== ${table.name}\n`;
    asciiDoc += '[cols="1,1,1", options="header"]\n';
    asciiDoc += `.${table.note ?? t("adoc.noDescription")}\n`;
    asciiDoc += "|===\n";
    asciiDoc += `${t("adoc.columns")}\n`;

    table.fields.forEach((field) => {
      asciiDoc += `| ${field.name} | ${field.type.type_name} | ${field.note ?? ""}\n`;
    });

    asciiDoc += "|===\n";

    const tableRefs = refs.filter(
      (ref) =>
        ref.endpoints[0].tableName === table.name ||
        ref.endpoints[1].tableName === table.name,
    );

    if (tableRefs.length > 0) {
      asciiDoc += `==== ${t("adoc.relations")}\n`;
      tableRefs.forEach((relation) => {
        asciiDoc += `- ${relation.endpoints[0].fieldNames.join(", ")} -> ${relation.endpoints[1].tableName}.${relation.endpoints[1].fieldNames.join(", ")}\n`;
      });
    }
    asciiDoc += "\n---\n\n";
  });

  return asciiDoc;
};
