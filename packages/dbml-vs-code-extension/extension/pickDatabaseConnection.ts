import { ExtensionContext, window } from "vscode";

import { getConnection, listConnections } from "./connectionStore";

const NEW_CONNECTION_LABEL = "$(add) New connection";

export interface PickedConnection {
  connectionString: string;
  isNew: boolean;
}

export async function pickDatabaseConnection(
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
