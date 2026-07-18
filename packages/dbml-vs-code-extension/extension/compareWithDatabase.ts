import {
  ExtensionContext,
  ProgressLocation,
  ViewColumn,
  window,
  workspace,
} from "vscode";
import {
  type DatabaseSchema,
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

import { dbImportErrorMessage } from "./dbImportErrorMessage";
import { pickDatabaseConnection } from "./pickDatabaseConnection";

export async function compareWithDatabase(
  context: ExtensionContext,
  preselected?: string,
): Promise<void> {
  const editor = window.activeTextEditor;
  if (editor == null || editor.document.languageId !== "dbml") {
    void window.showWarningMessage(
      "Open a .dbml file to compare it with a database.",
    );
    return;
  }
  const dbmlText = editor.document.getText();

  let connectionString: string;
  if (preselected != null && preselected !== "") {
    connectionString = preselected;
  } else {
    const picked = await pickDatabaseConnection(context);
    if (picked === undefined) {
      return;
    }
    connectionString = picked.connectionString;
  }

  let db: DatabaseSchema;
  try {
    db = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Reading database schema…",
      },
      async () => fetchPostgresSchema(connectionString),
    );
  } catch (error) {
    console.error("[dbml] reading the database schema failed", error);
    const dbError =
      error instanceof DbImportError
        ? error
        : new DbImportError(DbImportErrorCode.UNKNOWN, "Unknown error");
    void window.showErrorMessage(
      dbImportErrorMessage(dbError, "Failed to read the database schema."),
    );
    return;
  }

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

  try {
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
    // The UI string stays generic, but keep the cause in the Extension Host
    // log — otherwise a diff failure is undiagnosable from a bug report.
    console.error("[dbml] compare with database failed", error);
    void window.showErrorMessage(
      "Failed to compare the DBML file with the database.",
    );
  }
}
