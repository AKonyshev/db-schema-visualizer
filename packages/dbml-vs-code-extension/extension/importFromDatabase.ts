import {
  ExtensionContext,
  ProgressLocation,
  Uri,
  commands,
  l10n,
  window,
  workspace,
} from "vscode";
import {
  type DatabaseSchema,
  DbImportError,
  DbImportErrorCode,
  fetchPostgresSchema,
  listSchemaNames,
  schemaToDbml,
} from "db-to-dbml";

import { saveConnection } from "./connectionStore";
import { dbImportErrorMessage } from "./dbImportErrorMessage";
import { pickDatabaseConnection } from "./pickDatabaseConnection";

function showImportDbError(error: unknown): void {
  console.error("[dbml] database import failed", error);
  const dbError =
    error instanceof DbImportError
      ? error
      : new DbImportError(DbImportErrorCode.UNKNOWN, "Unknown error");
  void window.showErrorMessage(
    dbImportErrorMessage(
      dbError,
      l10n.t("Failed to import the schema from the database."),
    ),
  );
}

async function maybeSaveConnection(
  context: ExtensionContext,
  connectionString: string,
): Promise<void> {
  const save = await window.showQuickPick(["No", "Yes"], {
    placeHolder: l10n.t("Save this connection for next time?"),
  });
  if (save !== "Yes") {
    return;
  }

  const name = await window.showInputBox({
    prompt: l10n.t("Name for this connection"),
    ignoreFocusOut: true,
  });
  if (name != null && name !== "") {
    await saveConnection(context.secrets, name, connectionString);
  }
}

export async function importFromDatabase(
  context: ExtensionContext,
  preselected?: string,
): Promise<void> {
  let connectionString: string;
  let isNew = false;
  if (preselected != null && preselected !== "") {
    connectionString = preselected;
  } else {
    const picked = await pickDatabaseConnection(context);
    if (picked === undefined) {
      return;
    }
    connectionString = picked.connectionString;
    isNew = picked.isNew;
  }

  let db: DatabaseSchema;
  try {
    db = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: l10n.t("Importing database schema…"),
      },
      async () => fetchPostgresSchema(connectionString),
    );
  } catch (error) {
    showImportDbError(error);
    return;
  }

  const schemas = listSchemaNames(db);
  if (schemas.length === 0) {
    void window.showWarningMessage(
      l10n.t("No user schemas found in this database."),
    );
    return;
  }

  let schemaName = schemas[0];
  if (schemas.length > 1) {
    const pickedSchema = await window.showQuickPick(schemas, {
      placeHolder: l10n.t("Select the schema to import"),
    });
    if (pickedSchema === undefined) {
      return;
    }
    schemaName = pickedSchema;
  }

  let dbml: string;
  let droppedCrossSchemaRefs: number;
  try {
    ({ dbml, droppedCrossSchemaRefs } = schemaToDbml(db, schemaName));
  } catch (error) {
    showImportDbError(error);
    return;
  }

  // Saving is a separate failure domain from the database: a read-only path or
  // a full disk must not be reported as an import error.
  let target: Uri;
  try {
    const folder = workspace.workspaceFolders?.[0]?.uri;
    const defaultUri =
      folder != null ? Uri.joinPath(folder, `${schemaName}.dbml`) : undefined;
    const saveTarget = await window.showSaveDialog({
      defaultUri,
      filters: { DBML: ["dbml"] },
      saveLabel: l10n.t("Save DBML"),
    });
    if (saveTarget === undefined) {
      return;
    }
    target = saveTarget;

    await workspace.fs.writeFile(target, Buffer.from(dbml, "utf-8"));
  } catch (error) {
    console.error("[dbml] failed to save the imported DBML file", error);
    void window.showErrorMessage(
      l10n.t("The schema was imported, but saving the DBML file failed."),
    );
    return;
  }

  // The file is already on disk, so a failure to open it must not skip the
  // notices and the save prompt below — each step reports its own failure.
  try {
    await window.showTextDocument(target);
    await commands.executeCommand("dbml-erd-visualizer.previewDiagrams");
  } catch (error) {
    console.error("[dbml] failed to open the imported DBML file", error);
    void window.showErrorMessage(
      l10n.t("The DBML file was saved, but opening it or the diagram failed."),
    );
  }

  if (droppedCrossSchemaRefs > 0) {
    void window.showInformationMessage(
      l10n.t(
        "{0} cross-schema reference(s) were omitted.",
        droppedCrossSchemaRefs,
      ),
    );
  }

  if (isNew) {
    try {
      await maybeSaveConnection(context, connectionString);
    } catch (error) {
      console.error("[dbml] failed to save the connection", error);
      void window.showErrorMessage(
        l10n.t("The connection could not be saved."),
      );
    }
  }
}
