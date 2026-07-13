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

import {
  getConnection,
  listConnections,
  saveConnection,
} from "./connectionStore";

const NEW_CONNECTION_LABEL = "$(add) New connection";

function messageForError(error: DbImportError): string {
  switch (error.code) {
    case DbImportErrorCode.INVALID_CONNECTION_STRING:
      return "Invalid PostgreSQL connection string.";
    case DbImportErrorCode.AUTH_FAILED:
      return "Authentication failed. Check the username and password.";
    case DbImportErrorCode.UNREACHABLE:
      return "Could not reach the database host.";
    case DbImportErrorCode.DATABASE_NOT_FOUND:
      return "The specified database does not exist.";
    default:
      return "Failed to import the schema from the database.";
  }
}

interface PickedConnection {
  connectionString: string;
  isNew: boolean;
}

async function pickConnectionString(
  context: ExtensionContext,
): Promise<PickedConnection | undefined> {
  const saved = await listConnections(context.secrets);
  const choice = await window.showQuickPick([...saved, NEW_CONNECTION_LABEL], {
    placeHolder: "Select a saved connection or create a new one",
  });
  if (choice === undefined) {
    return undefined;
  }

  if (choice !== NEW_CONNECTION_LABEL) {
    const existing = await getConnection(context.secrets, choice);
    return existing == null
      ? undefined
      : { connectionString: existing, isNew: false };
  }

  const entered = await window.showInputBox({
    prompt: "PostgreSQL connection string",
    placeHolder: "postgres://user:password@host:5432/database",
    password: true,
    ignoreFocusOut: true,
  });
  return entered == null || entered === ""
    ? undefined
    : { connectionString: entered, isNew: true };
}

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
): Promise<void> {
  const picked = await pickConnectionString(context);
  if (picked === undefined) {
    return;
  }
  const { connectionString, isNew } = picked;

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
      const picked = await window.showQuickPick(schemas, {
        placeHolder: "Select the schema to import",
      });
      if (picked === undefined) {
        return;
      }
      schemaName = picked;
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
    void window.showErrorMessage(messageForError(dbError));
  }
}
