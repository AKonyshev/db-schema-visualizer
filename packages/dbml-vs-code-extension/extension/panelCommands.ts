import { ExtensionContext, l10n, window } from "vscode";

import { compareWithDatabase } from "./compareWithDatabase";
import type { ConnectionsTreeProvider } from "./connectionsTreeProvider";
import {
  deleteConnection,
  getConnection,
  saveConnection,
} from "./connectionStore";
import { importFromDatabase } from "./importFromDatabase";
import type { PanelNode } from "./panelNodes";

export async function addConnection(
  context: ExtensionContext,
  provider: ConnectionsTreeProvider,
): Promise<void> {
  const name = await window.showInputBox({
    prompt: l10n.t("Name for this connection"),
    ignoreFocusOut: true,
  });
  if (name == null || name === "") {
    return;
  }
  const connectionString = await window.showInputBox({
    prompt: l10n.t("PostgreSQL connection string"),
    placeHolder: "postgres://user:password@host:5432/database",
    password: true,
    ignoreFocusOut: true,
  });
  if (connectionString == null || connectionString === "") {
    return;
  }
  await saveConnection(context.secrets, name, connectionString);
  provider.refresh();
}

export async function deleteConnectionCommand(
  context: ExtensionContext,
  provider: ConnectionsTreeProvider,
  node?: PanelNode,
): Promise<void> {
  if (node === undefined || node.kind !== "connection") {
    return;
  }
  // One binding for the button label and the comparison: localizing only the
  // label would make the confirmation never match.
  const deleteLabel = l10n.t("Delete");
  const confirm = await window.showWarningMessage(
    l10n.t('Delete connection "{0}"?', node.name),
    { modal: true },
    deleteLabel,
  );
  if (confirm !== deleteLabel) {
    return;
  }
  await deleteConnection(context.secrets, node.name);
  provider.refresh();
}

export async function importFromConnection(
  context: ExtensionContext,
  node?: PanelNode,
): Promise<void> {
  if (node === undefined || node.kind !== "connection") {
    return;
  }
  const connectionString = await getConnection(context.secrets, node.name);
  if (connectionString == null) {
    void window.showErrorMessage(
      l10n.t('Connection "{0}" not found.', node.name),
    );
    return;
  }
  await importFromDatabase(context, { connectionString });
}

export async function compareWithConnection(
  context: ExtensionContext,
  node?: PanelNode,
): Promise<void> {
  if (node === undefined || node.kind !== "connection") {
    return;
  }
  const connectionString = await getConnection(context.secrets, node.name);
  if (connectionString == null) {
    void window.showErrorMessage(
      l10n.t('Connection "{0}" not found.', node.name),
    );
    return;
  }
  await compareWithDatabase(context, connectionString);
}
