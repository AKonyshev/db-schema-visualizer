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
  withProgress: jest.fn(
    async (_options: unknown, task: (progress: unknown) => Thenable<unknown>) =>
      task({}),
  ),
};

export const workspace = {
  workspaceFolders: undefined as { uri: unknown }[] | undefined,
  fs: {
    writeFile: jest.fn(),
  },
  openTextDocument: jest.fn(),
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
  joinPath: jest.fn((...parts: unknown[]) => parts.join("/")),
};

export const ProgressLocation = {
  Notification: 15,
};

export const ViewColumn = {
  Beside: 2,
};

export class ExtensionContext {}
