export class DbmlParseError extends Error {
  public readonly line: number;
  public readonly column: number;

  constructor(message: string, line: number, column: number) {
    super(message);
    this.name = "DbmlParseError";
    this.line = line;
    this.column = column;
  }
}
