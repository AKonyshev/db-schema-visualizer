/**
 * `detailLevel` names the detail level the arrangement was made at.
 *
 * A file holds one set of coordinates, and the tables are laid out by the
 * height they are drawn at — so an arrangement made with only the headers
 * showing puts tables on top of one another if it is read back at full detail.
 * Recording the level is what lets coordinates be read back safely: at their
 * own level they are used, at any other the layout is computed instead.
 *
 * Optional, and absent means full detail. Every block written before this field
 * existed holds a full-detail arrangement, because that was the only kind
 * anything made — and per entry rather than once for the block, so that a
 * reader written before this field simply does not see it. The block stays a
 * flat array, which is what such a reader parses it as.
 *
 * A plain string rather than the visualizer's `TableDetailLevel`: this type is
 * the wire format, shared by the parser, the extension and the site, and none
 * of them should have to depend on the enum to read a file.
 */
export class MetaInfo {
  name: string;
  x: number;
  y: number;
  hidden?: boolean;
  detailLevel?: string;

  constructor(
    name: string,
    x: number,
    y: number,
    hidden?: boolean,
    detailLevel?: string,
  ) {
    this.name = name;
    this.x = x;
    this.y = y;
    if (hidden === true) this.hidden = true;
    if (detailLevel !== undefined) this.detailLevel = detailLevel;
  }
}

export interface MetaInfoEntry {
  name: string;
  x: number;
  y: number;
  hidden?: boolean;
  detailLevel?: string;
}

/** What a block says when it does not name a level. See `MetaInfo`. */
export const DEFAULT_META_INFO_DETAIL_LEVEL = "FullDetails";
