import {
  ExtensionContext,
  ProgressLocation,
  ViewColumn,
  window,
  workspace,
} from "vscode";
import {
  DbImportError,
  DbImportErrorCode,
  fetchPostgresSchema,
  listSchemaNames,
} from "db-to-dbml";
import {
  DbmlParseError,
  databaseSchemaToModel,
  diffSchemas,
  parseDbmlToModel,
  renderDiffMarkdown,
} from "schema-diff";

import { getConnection, listConnections } from "./connectionStore";

const NEW_CONNECTION_LABEL = "$(add) New connection";

function connectionErrorMessage(error: DbImportError): string {
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
      return "Failed to read the database schema.";
  }
}

async function pickConnectionString(
  context: ExtensionContext,
): Promise<string | undefined> {
  const saved = await listConnections(context.secrets);
  const choice = await window.showQuickPick([...saved, NEW_CONNECTION_LABEL], {
    placeHolder: "Select a saved connection or create a new one",
  });
  if (choice === undefined) {
    return undefined;
  }

  if (choice !== NEW_CONNECTION_LABEL) {
    return getConnection(context.secrets, choice);
  }

  const entered = await window.showInputBox({
    prompt: "PostgreSQL connection string",
    placeHolder: "postgres://user:password@host:5432/database",
    password: true,
    ignoreFocusOut: true,
  });
  return entered === "" ? undefined : entered;
}

export async function compareWithDatabase(
  context: ExtensionContext,
): Promise<void> {
  const editor = window.activeTextEditor;
  if (editor == null || editor.document.languageId !== "dbml") {
    void window.showWarningMessage(
      "Open a .dbml file to compare it with a database.",
    );
    return;
  }
  const dbmlText = editor.document.getText();

  const connectionString = await pickConnectionString(context);
  if (connectionString == null || connectionString === "") {
    return;
  }

  try {
    const db = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Reading database schema…",
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
        placeHolder: "Select the database schema to compare against",
      });
      if (picked === undefined) {
        return;
      }
      schemaName = picked;
    }

    const model = parseDbmlToModel(dbmlText);
    const database = databaseSchemaToModel(db, schemaName);
    const diff = diffSchemas(model, database);
    const markdown = renderDiffMarkdown(diff);

    const doc = await workspace.openTextDocument({
      language: "markdown",
      content: markdown,
    });
    await window.showTextDocument(doc, ViewColumn.Beside);
  } catch (error) {
    if (error instanceof DbmlParseError) {
      void window.showErrorMessage(
        `DBML parse error at line ${error.line}:${error.column} — ${error.message}`,
      );
      return;
    }
    const dbError =
      error instanceof DbImportError
        ? error
        : new DbImportError(DbImportErrorCode.UNKNOWN, "Unknown error");
    void window.showErrorMessage(connectionErrorMessage(dbError));
  }
}
