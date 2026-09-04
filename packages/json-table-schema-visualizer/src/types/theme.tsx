export enum Theme {
  light = "light",
  dark = "dark",
}
export interface ThemeColors {
  text: {
    900: string;
    700: string;
  };
  connection: {
    default: string;
    active: string;
  };
  tableHeader: {
    bg: string;
    fg: string;
  };
  colAccent: string;
  /** The outline on a selected table and the fill of the marquee that caught
   * it. Both are the accent, because both mean "the reader picked this". */
  selection: {
    stroke: string;
    fill: string;
  };
  table: {
    bg: string;
    shadow: string;
  };
  /**
   * The note bubble is a surface of its own, so it carries its own foregrounds.
   * Nothing outside the bubble may use these, and nothing inside it may reach
   * for the palette: the bubble is dark in both themes, so a colour picked for
   * the page is picked against the wrong background.
   */
  note: {
    bg: string;
    fg: string;
    /** Enum values, listed under the note. */
    muted: string;
    /** The "Enum" label. */
    danger: string;
    /** The enum's name. */
    success: string;
  };
  bg: string;
}

export interface ThemeProviderValue {
  themeColors: ThemeColors;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
