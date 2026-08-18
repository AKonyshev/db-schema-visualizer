/**
 * How a relation is drawn between two tables.
 *
 * Not a matter of taste alone: the two want different room. A curve sweeps
 * through open space and reads well when there are few of them, so the tables
 * can sit close together. Right angles need corridors to run in, and a diagram
 * drawn for them is looser — which is why the layout asks which is in use.
 */
export enum RelationStyle {
  Orthogonal = "orthogonal",
  Bezier = "bezier",
}

/**
 * What a schema is drawn with unless the reader says otherwise.
 *
 * Curves: they are the better-looking of the two and read well for as long as a
 * diagram is small enough to take in, which most are. Right angles earn their
 * keep on the large ones, and that is a choice worth making deliberately rather
 * than having made for you.
 */
export const DEFAULT_RELATION_STYLE = RelationStyle.Bezier;

export const isRelationStyle = (value: unknown): value is RelationStyle =>
  value === RelationStyle.Orthogonal || value === RelationStyle.Bezier;
