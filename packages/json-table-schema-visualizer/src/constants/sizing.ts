export const TABLE_DEFAULT_MIN_WIDTH = 150;
export const TABLE_COLOR_HEIGHT = 6;
export const TABLE_LINE_HEIGHT = 25;
export const COLUMN_HEIGHT = 30;
export const TABLE_HEADER_HEIGHT = COLUMN_HEIGHT + TABLE_COLOR_HEIGHT;
export const CONNECTION_STROKE = 2;
export const DEFAULT_PADDING = 5;
export const CROSS_CONNECTION_MIN_MARGIN = 20;
export const CONNECTION_MARGIN = 40;
export const COLS_OFFSET_Y_TO_COL_MIDDLE =
  TABLE_COLOR_HEIGHT +
  COLUMN_HEIGHT +
  COLUMN_HEIGHT / 2; /* to point to cols middle */
export const CONNECTION_HANDLE_OFFSET = 20;
export const PADDINGS = {
  xs: 5,
  sm: 8,
  md: 10,
  lg: 20,
};
export const TABLE_FIELD_TYPE_PADDING = PADDINGS.sm;

/**
 * The `PK` / `FK` / `UK` pill drawn at the right of a column line.
 *
 * `FONT_SIZES.badge` is smaller than the column text on purpose: a badge is an
 * aside about the column, not a second name for it.
 */
export const BADGE = {
  paddingX: 4,
  /** Between two badges, and between the type and the first of them. */
  gap: 4,
  height: 15,
  radius: 3,
};

/**
 * How far the outline around a selected table sits outside its box, so the
 * table's own border is still visible under it.
 */
export const SELECTION_OUTLINE_INSET = 3;

export const FONT_SIZES = {
  md: 15,
  lg: 18,
  tableTitle: 18,
  badge: 10,
};

export const FIELD_DETAILS_CARET = {
  w: 5,
  h: 5,
};

export const FIELD_DETAILS_TOOLTIPS_W = 200;

export const TABLES_GAP_X = 50;
export const TABLES_GAP_Y = 50;
export const DIAGRAM_PADDING = 60;
export const CONNECTION_RELATION_SYMBOL_OFFSET = 8;

export const STAGE_SCALE_FACTOR = 0.75;
