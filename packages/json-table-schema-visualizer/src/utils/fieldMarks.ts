import { type JSONTableField } from "shared/types/tableSchema";

import { computeTextSize } from "./computeTextSize";

import { BADGE, FONT_SIZES } from "@/constants/sizing";

/**
 * The key a column is, said in the notation Mermaid's ER diagrams use and most
 * modelling tools have some form of.
 */
export type FieldBadge = "PK" | "FK" | "UK";

/**
 * NOT NULL, in Barker's notation, where `*` is a mandatory attribute.
 *
 * Barker's `o` for an optional one is deliberately not used: a diagram of a
 * real schema is mostly optional columns, and a mark on nearly every line is a
 * mark that stops being read. What the legend says instead is that an unmarked
 * column may be null.
 */
export const MANDATORY_MARK = "*";

export interface FieldMarks {
  typeName: string;
  /** NOT NULL. Drawn as `MANDATORY_MARK` after the type. */
  mandatory: boolean;
  badges: FieldBadge[];
}

/**
 * Everything drawn at the right of a column line, from the field and from one
 * fact the field does not carry.
 *
 * `isForeignKey` comes from the relations rather than the column, because
 * `is_relation` is set on both ends of one — see `computeForeignKeyFields`.
 */
export const computeFieldMarks = (
  field: JSONTableField,
  isForeignKey: boolean,
): FieldMarks => {
  const isPrimaryKey = field.pk === true;
  const badges: FieldBadge[] = [];

  if (isPrimaryKey) {
    badges.push("PK");
  }

  if (isForeignKey) {
    badges.push("FK");
  }

  // Not alongside `PK`: a primary key is unique by definition, so the second
  // badge would tell the reader nothing and cost the width of a pill.
  if (field.unique === true && !isPrimaryKey) {
    badges.push("UK");
  }

  return {
    typeName: field.type.type_name,
    mandatory: field.not_null === true,
    badges,
  };
};

/** The type as it is drawn: with the mandatory mark when there is one. */
export const fieldTypeText = (marks: FieldMarks): string =>
  marks.mandatory ? `${marks.typeName} ${MANDATORY_MARK}` : marks.typeName;

/**
 * How much room the badges need, pills and gaps included.
 *
 * Used both to lay the table out and to draw the row, so that what the layout
 * reserved and what the renderer puts there cannot come apart.
 */
export const badgesWidth = (badges: FieldBadge[]): number => {
  if (badges.length === 0) {
    return 0;
  }

  const pills = badges.reduce(
    (total, badge) =>
      total +
      computeTextSize(badge, { fontSize: FONT_SIZES.badge }).width +
      BADGE.paddingX * 2,
    0,
  );

  // One gap before the first pill, separating them from the type, and one
  // between each pair.
  return pills + BADGE.gap * badges.length;
};
