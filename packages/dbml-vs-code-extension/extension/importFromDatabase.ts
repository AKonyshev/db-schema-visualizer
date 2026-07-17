import {
  ExtensionContext,
  ProgressLocation,
  Uri,
  commands,
  window,
  workspace,
} from "vscode";
import {
  DbImportError,
  DbImportErrorCode,
  fetchPostgresSchema,
  listSchemaNames,
  schemaToDbml,
} from "db-to-dbml";

import { saveConnection } from "./connectionStore";
import { dbImportErrorMessage } from "./dbImportErrorMessage";
import { pickDatabaseConnection } from "./pickDatabaseConnection";

async function maybeSaveConnection(
  context: ExtensionContext,
  connectionString: string,
): Promise<void> {
  const save = await window.showQuickPick(["No", "Yes"], {
    placeHolder: "Save this connection for next time?",
  });
  if (save !== "Yes") {
    return;
  }

  const name = await window.showInputBox({
    prompt: "Name for this connection",
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

  try {
    const db = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Importing database schema…",
      },
      async () => fetchPostgresSchema(connectionString),
    );

    const schemas = listSchemaNames(db);
    if (schemas.length === 0) {
      void window.showWarningMessage("No user schemas found in this database.");
      return;
    }

    let schemaName = schemas[0];
    if (schemas.length > 1) {
      const pickedSchema = await window.showQuickPick(schemas, {
        placeHolder: "Select the schema to import",
      });
      if (pickedSchema === undefined) {
        return;
      }
      schemaName = pickedSchema;
    }

    const { dbml, droppedCrossSchemaRefs } = schemaToDbml(db, schemaName);

    const folder = workspace.workspaceFolders?.[0]?.uri;
    const defaultUri =
      folder != null ? Uri.joinPath(folder, `${schemaName}.dbml`) : undefined;
    const target = await window.showSaveDialog({
      defaultUri,
      filters: { DBML: ["dbml"] },
      saveLabel: "Save DBML",
    });
    if (target === undefined) {
      return;
    }

    await workspace.fs.writeFile(target, Buffer.from(dbml, "utf-8"));
    await window.showTextDocument(target);
    await commands.executeCommand("dbml-erd-visualizer.previewDiagrams");

    if (droppedCrossSchemaRefs > 0) {
      void window.showInformationMessage(
        `${droppedCrossSchemaRefs} cross-schema reference(s) were omitted.`,
      );
    }

    if (isNew) {
      await maybeSaveConnection(context, connectionString);
    }
  } catch (error) {
    const dbError =
      error instanceof DbImportError
        ? error
        : new DbImportError(DbImportErrorCode.UNKNOWN, "Unknown error");
    void window.showErrorMessage(
      dbImportErrorMessage(
        dbError,
        "Failed to import the schema from the database.",
      ),
    );
  }
}
