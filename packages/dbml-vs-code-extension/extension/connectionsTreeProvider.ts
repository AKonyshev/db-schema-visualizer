import * as vscode from "vscode";

import { listConnections } from "./connectionStore";
import {
  ACTION_NODES,
  buildConnectionNodes,
  type PanelNode,
} from "./panelNodes";

export class ConnectionsTreeProvider
  implements vscode.TreeDataProvider<PanelNode>
{
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly secrets: vscode.SecretStorage) {}

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(node: PanelNode): vscode.TreeItem {
    switch (node.kind) {
      case "group": {
        const item = new vscode.TreeItem(
          node.label,
          vscode.TreeItemCollapsibleState.Expanded,
        );
        item.contextValue =
          node.id === "actions" ? "dbmlActionsGroup" : "dbmlConnectionsGroup";
        return item;
      }
      case "action": {
        const item = new vscode.TreeItem(
          node.label,
          vscode.TreeItemCollapsibleState.None,
        );
        item.command = { command: node.commandId, title: node.label };
        item.iconPath = new vscode.ThemeIcon(node.icon);
        return item;
      }
      case "connection": {
        const item = new vscode.TreeItem(
          node.name,
          vscode.TreeItemCollapsibleState.None,
        );
        item.contextValue = "dbmlConnection";
        item.iconPath = new vscode.ThemeIcon("database");
        return item;
      }
      case "empty": {
        const item = new vscode.TreeItem(
          node.label,
          vscode.TreeItemCollapsibleState.None,
        );
        item.contextValue = "dbmlEmpty";
        return item;
      }
    }
  }

  public async getChildren(node?: PanelNode): Promise<PanelNode[]> {
    if (node === undefined) {
      return [
        { kind: "group", id: "actions", label: "Actions" },
        { kind: "group", id: "connections", label: "Connections" },
      ];
    }
    if (node.kind === "group" && node.id === "actions") {
      return ACTION_NODES;
    }
    if (node.kind === "group" && node.id === "connections") {
      return buildConnectionNodes(await listConnections(this.secrets));
    }
    return [];
  }
}
