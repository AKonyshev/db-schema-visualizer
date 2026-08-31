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
  red: string;
  green: string;
  enumItem: string;
  white: string;
  noteBg: string;
  bg: string;
}

export interface ThemeProviderValue {
  themeColors: ThemeColors;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
