import { updateMetaInfoHidden } from "./updateMetaInfoHidden";

import type { TableCoordEntry } from "./upsertMetaInfoInDbml";

export const toggleTableRefs = (
  content: string,
  tableName: string,
  coords?: TableCoordEntry,
): string => {
  const lines = content.split("\n");
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tablePattern = new RegExp(`(?:"${escaped}"|${escaped})\\.`);

  const refLineIndices: number[] = [];
  lines.forEach((line, i) => {
    const stripped = line.replace(/^(\s*)\/\/\s*/, "").trimStart();
    if (stripped.startsWith("Ref") && tablePattern.test(line)) {
      refLineIndices.push(i);
    }
  });

  if (refLineIndices.length === 0) return content;

  const hasUncommented = refLineIndices.some(
    (i) => !lines[i].trimStart().startsWith("//"),
  );
  const isHiding = hasUncommented;

  if (hasUncommented) {
    refLineIndices.forEach((i) => {
      const indent = lines[i].match(/^(\s*)/)?.[1] ?? "";
      lines[i] = indent + "// " + lines[i].trimStart();
    });
  } else {
    refLineIndices.forEach((i) => {
      lines[i] = lines[i].replace(/^(\s*)\/\/\s?/, "$1");
    });
  }

  return updateMetaInfoHidden(lines.join("\n"), tableName, isHiding, coords);
};
