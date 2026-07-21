export enum Position {
  Left = "left",
  Top = "top",
  Right = "right",
  Bottom = "bottom",
}

export interface XYPosition {
  x: number;
  y: number;
}

export interface XYWHPosition extends XYPosition {
  w: number;
  h: number;
}
