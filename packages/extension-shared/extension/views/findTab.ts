// No `vscode` import: matching a tab is shape comparison, and keeping it here
// means it can be tested without the workbench.

/** The parts of a `TabInputText` / `TabInputCustom` this needs. */
export interface TabInputLike {
  readonly uri?: { toString: () => string };
  readonly viewType?: string;
}

export interface TabLike {
  readonly input: unknown;
}

/**
 * The tab showing `documentUri` as the custom editor `viewType` — or as plain
 * text when `viewType` is omitted, since a `TabInputText` carries no viewType.
 *
 * Diff and webview tabs are skipped for free: neither exposes a bare `uri`.
 */
export const findTab = <T extends TabLike>(
  tabs: readonly T[],
  documentUri: string,
  viewType?: string,
): T | undefined =>
  tabs.find((tab) => {
    const input = tab.input as TabInputLike | null | undefined;
    if (input == null || typeof input !== "object") return false;
    if (input.uri?.toString() !== documentUri) return false;

    return input.viewType === viewType;
  });
