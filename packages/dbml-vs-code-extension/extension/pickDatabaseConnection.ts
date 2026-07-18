import { ExtensionContext, QuickPickItem, window } from "vscode";

import { getConnection, listConnections } from "./connectionStore";

export const NEW_CONNECTION_LABEL = "$(add) New connection";

export interface PickedConnection {
  connectionString: string;
  isNew: boolean;
}

type ConnectionPickItem = QuickPickItem &
  ({ pickKind: "saved"; connectionName: string } | { pickKind: "new" });

export async function pickDatabaseConnection(
  context: ExtensionContext,
): Promise<PickedConnection | undefined> {
  const saved = await listConnections(context.secrets);
  const items: ConnectionPickItem[] = [
    ...saved.map(
      (name): ConnectionPickItem => ({
        label: name,
        pickKind: "saved",
        connectionName: name,
      }),
    ),
    { label: NEW_CONNECTION_LABEL, pickKind: "new" },
  ];
  const choice = await window.showQuickPick(items, {
    placeHolder: "Select a saved connection or create a new one",
  });
  if (choice === undefined) {
    return undefined;
  }

  if (choice.pickKind === "saved") {
    const existing = await getConnection(
      context.secrets,
      choice.connectionName,
    );
    if (existing == null) {
      void window.showErrorMessage(
        `Saved connection "${choice.connectionName}" is no longer available.`,
      );
      return undefined;
    }
    return { connectionString: existing, isNew: false };
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
