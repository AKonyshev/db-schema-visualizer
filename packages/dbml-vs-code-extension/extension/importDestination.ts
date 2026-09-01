import { Uri, l10n, window, workspace } from "vscode";

import type { ImportTarget } from "./pickImportTargets";

// A single file is named after what is in it — which, for one schema, is the
// schema, the name this command has always produced. Several files are named
// after their databases: two databases each holding a lone `public` would
// otherwise write the same file twice.
export function importFileName(
  target: ImportTarget,
  isOnlyTarget: boolean,
): string {
  return isOnlyTarget && target.schemaNames.length === 1
    ? `${target.schemaNames[0]}.dbml`
    : `${target.databaseName}.dbml`;
}

async function exists(uri: Uri): Promise<boolean> {
  try {
    await workspace.fs.stat(uri);
    return true;
  } catch {
    // `stat` throws FileNotFound for the ordinary case, which is not an error
    // here — it is the answer.
    return false;
  }
}

export async function resolveImportDestination(
  targets: ImportTarget[],
): Promise<Map<string, Uri> | undefined> {
  const folder = workspace.workspaceFolders?.[0]?.uri;

  if (targets.length === 1) {
    const name = importFileName(targets[0], true);
    const target = await window.showSaveDialog({
      defaultUri: folder != null ? Uri.joinPath(folder, name) : undefined,
      filters: { DBML: ["dbml"] },
      saveLabel: l10n.t("Save DBML"),
    });
    // The save dialog does its own overwrite confirmation.
    return target === undefined
      ? undefined
      : new Map([[targets[0].databaseName, target]]);
  }

  const picked = await window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    defaultUri: folder,
    openLabel: l10n.t("Select folder"),
  });
  const directory = picked?.[0];
  if (directory === undefined) {
    return undefined;
  }

  const planned = targets.map((target) => {
    const fileName = importFileName(target, false);
    return {
      databaseName: target.databaseName,
      fileName,
      uri: Uri.joinPath(directory, fileName),
    };
  });

  const present = (
    await Promise.all(
      planned.map(async (file) =>
        (await exists(file.uri)) ? file.fileName : undefined,
      ),
    )
  ).filter((name): name is string => name !== undefined);

  if (present.length > 0) {
    // One binding for the button label and the comparison: localizing only the
    // label would make the confirmation never match.
    const overwrite = l10n.t("Overwrite");
    const confirm = await window.showWarningMessage(
      l10n.t(
        "These files already exist and will be replaced: {0}",
        present.join(", "),
      ),
      { modal: true },
      overwrite,
    );
    if (confirm !== overwrite) {
      return undefined;
    }
  }

  return new Map(planned.map((file) => [file.databaseName, file.uri]));
}
