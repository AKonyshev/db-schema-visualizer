import { type JSONTableTable } from "shared/types/tableSchema";
import { computeRelationalFieldKey } from "shared/utils/computeRelationalFieldKey";

import { computeTextSize } from "../computeTextSize";
import { badgeLayout, computeFieldMarks, fieldTypeText } from "../fieldMarks";

/**
 * How wide each of a table's column lines wants to be.
 *
 * Widths rather than the strings this used to return, because a line is no
 * longer only text: the key badges are pills, and their padding is part of what
 * the table has to be wide enough for. Measuring the letters alone would lay
 * the table out a few pixels narrower than it is drawn, and the last badge
 * would hang over the edge of the box.
 */
export const computeTableLineWidths = (
  table: JSONTableTable,
  foreignKeys: ReadonlySet<string>,
): number[] =>
  table.fields.map((field) => {
    const marks = computeFieldMarks(
      field,
      foreignKeys.has(computeRelationalFieldKey(table.name, field.name)),
    );

    const { width } = computeTextSize(`${field.name} ${fieldTypeText(marks)}`);

    return width + badgeLayout(marks.badges).totalWidth;
  });
