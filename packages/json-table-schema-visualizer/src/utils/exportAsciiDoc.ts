import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";

export const generateAsciiDoc = (
  tables: JSONTableTable[],
  refs: JSONTableRef[],
): string => {
  let asciiDoc = "== Описание таблиц\n";

  tables.forEach((table) => {
    asciiDoc += `=== ${table.name}\n`;
    asciiDoc += '[cols="1,1,1", options="header"]\n';
    asciiDoc += `.${table.note ?? "Нет описания"}\n`;
    asciiDoc += "|===\n";
    asciiDoc += "| Наименование | Тип | Описание\n";

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
      asciiDoc += "==== Связи:\n";
      tableRefs.forEach((relation) => {
        asciiDoc += `- ${relation.endpoints[0].fieldNames.join(", ")} -> ${relation.endpoints[1].tableName}.${relation.endpoints[1].fieldNames.join(", ")}\n`;
      });
    }
    asciiDoc += "\n---\n\n";
  });

  return asciiDoc;
};
