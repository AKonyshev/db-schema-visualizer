type TextEditor = {
  document: { languageId: string; getText: () => string };
};

export const window = {
  activeTextEditor: undefined as TextEditor | undefined,
  showQuickPick: jest.fn(),
  showInputBox: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  showTextDocument: jest.fn(),
  showSaveDialog: jest.fn(),
  showOpenDialog: jest.fn(),
  registerCustomEditorProvider: jest.fn(() => ({ dispose: jest.fn() })),
  withProgress: jest.fn(
    async (
      _options: unknown,
      task: (progress: unknown, token: unknown) => Thenable<unknown>,
    ) =>
      await task(
        { report: jest.fn() },
        { isCancellationRequested: false, onCancellationRequested: jest.fn() },
      ),
  ),
};

export const workspace = {
  workspaceFolders: undefined as { uri: unknown }[] | undefined,
  fs: {
    writeFile: jest.fn(),
    stat: jest.fn(),
  },
  openTextDocument: jest.fn(),
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
    update: jest.fn(),
  })),
  applyEdit: jest.fn(),
  onDidChangeTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
};

export const commands = {
  executeCommand: jest.fn(),
};

export const l10n = {
  // Returns the source string with {N} placeholders substituted, so existing
  // assertions on English text keep working unchanged.
  t: (message: string, ...args: unknown[]): string =>
    args.reduce<string>(
      (acc, arg, index) => acc.replace(`{${index}}`, String(arg)),
      message,
    ),
};

export const Uri = {
  joinPath: jest.fn((base: unknown, ...parts: string[]) => {
    const path = [
      String((base as { path?: string })?.path ?? base),
      ...parts,
    ].join("/");
    return { path, fsPath: path, toString: () => path };
  }),
  parse: jest.fn((value: string) => ({ toString: () => value })),
};

export const QuickPickItemKind = {
  Separator: -1,
  Default: 0,
} as const;

export const ProgressLocation = {
  Notification: 15,
};

export const ViewColumn = {
  One: 1,
  Beside: 2,
  Active: -1,
};

export const env = { language: "en" };

export const languages = {
  createDiagnosticCollection: jest.fn(() => ({
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    dispose: jest.fn(),
  })),
};

export class Position {
  constructor(
    readonly line: number,
    readonly character: number,
  ) {}
}

export class Range {
  constructor(
    readonly start: Position,
    readonly end: Position,
  ) {}
}

export const DiagnosticSeverity = { Error: 0 } as const;

export class Diagnostic {
  constructor(
    readonly range: Range,
    readonly message: string,
    readonly severity?: number,
  ) {}
}

export class ExtensionContext {}

export const TreeItemCollapsibleState = {
  None: 0,
  Collapsed: 1,
  Expanded: 2,
} as const;

export class TreeItem {
  public contextValue?: string;
  public iconPath?: unknown;
  public command?: unknown;

  constructor(
    readonly label: string,
    readonly collapsibleState?: number,
  ) {}
}

export class ThemeIcon {
  constructor(readonly id: string) {}
}

export class EventEmitter<T> {
  public readonly event = jest.fn();

  public fire(_value?: T): void {}
}
