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

/** One pill, placed relative to the start of the badge block. */
export interface BadgePill {
  badge: FieldBadge;
  x: number;
  width: number;
}

export interface BadgeLayout {
  /** What the badges take in total, pills and gaps included. */
  totalWidth: number;
  pills: BadgePill[];
}

/**
 * The drawn width of one label, measured once for the life of the page.
 *
 * `computeTextSize` clones a Konva node to measure with a font size of its own,
 * and this is asked for on every render of every column that carries a badge.
 * There are three labels and one font size, so the answer cannot change between
 * calls and there is nothing to invalidate.
 */
const labelWidths = new Map<FieldBadge, number>();

const labelWidth = (badge: FieldBadge): number => {
  const cached = labelWidths.get(badge);

  if (cached !== undefined) {
    return cached;
  }

  const width = computeTextSize(badge, { fontSize: FONT_SIZES.badge }).width;

  labelWidths.set(badge, width);

  return width;
};

/**
 * Where each pill goes and how much room they need altogether.
 *
 * One function for both, because the two have to agree: the table is laid out
 * wide enough for `totalWidth`, and the renderer draws at `pills`. Computed
 * apart, they drift, and the last badge hangs over the edge of the table.
 */
export const badgeLayout = (badges: FieldBadge[]): BadgeLayout => {
  const pills: BadgePill[] = [];
  // One gap before the first pill, separating the block from the type, and one
  // between each pair.
  let x = BADGE.gap;

  for (const badge of badges) {
    const width = labelWidth(badge) + BADGE.paddingX * 2;

    pills.push({ badge, x, width });
    x += width + BADGE.gap;
  }

  return { totalWidth: badges.length === 0 ? 0 : x - BADGE.gap, pills };
};

/** What the badges take, for the code that only needs to reserve the room. */
export const badgesWidth = (badges: FieldBadge[]): number =>
  badgeLayout(badges).totalWidth;
