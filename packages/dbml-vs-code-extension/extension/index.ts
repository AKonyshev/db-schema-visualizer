import { commands, window, type ExtensionContext } from "vscode";
import { parseDBMLToJSON } from "dbml-to-json-table-schema";

import { MainPanel } from "extension-shared/extension/views/panel";
import {
  EXTENSION_CONFIG_SESSION,
  WEB_VIEW_NAME,
  WEB_VIEW_TITLE,
} from "@/extension/constants";
import { importFromDatabase } from "./importFromDatabase";
import { compareWithDatabase } from "./compareWithDatabase";
import { ConnectionsTreeProvider } from "./connectionsTreeProvider";
import {
  addConnection,
  compareWithConnection,
  deleteConnectionCommand,
  importFromConnection,
} from "./panelCommands";
import type { PanelNode } from "./panelNodes";

export function activate(context: ExtensionContext): void {
  const treeProvider = new ConnectionsTreeProvider(context.secrets);

  context.subscriptions.push(
    window.registerTreeDataProvider("dbml-erd-visualizer.panel", treeProvider),
    context.secrets.onDidChange(() => {
      treeProvider.refresh();
    }),
    commands.registerCommand(
      "dbml-erd-visualizer.previewDiagrams",
      async () => {
        lunchExtension(context);
      },
    ),
    commands.registerCommand("dbml-erd-visualizer.toggleTableRefs", () => {
      MainPanel.postMessageToWebview({ type: "toggleTableRefs" });
    }),
    commands.registerCommand("dbml-erd-visualizer.importFromDatabase", () => {
      void importFromDatabase(context);
    }),
    commands.registerCommand("dbml-erd-visualizer.compareWithDatabase", () => {
      void compareWithDatabase(context);
    }),
    commands.registerCommand("dbml-erd-visualizer.addConnection", () => {
      void addConnection(context, treeProvider);
    }),
    commands.registerCommand("dbml-erd-visualizer.refreshConnections", () => {
      treeProvider.refresh();
    }),
    commands.registerCommand(
      "dbml-erd-visualizer.deleteConnection",
      (node?: PanelNode) => {
        void deleteConnectionCommand(context, treeProvider, node);
      },
    ),
    commands.registerCommand(
      "dbml-erd-visualizer.importFromConnection",
      (node?: PanelNode) => {
        void importFromConnection(context, node);
      },
    ),
    commands.registerCommand(
      "dbml-erd-visualizer.compareWithConnection",
      (node?: PanelNode) => {
        void compareWithConnection(context, node);
      },
    ),
  );
}

const lunchExtension = (context: ExtensionContext): void => {
  MainPanel.render({
    context,
    extensionConfigSession: EXTENSION_CONFIG_SESSION,
    webviewConfig: {
      name: WEB_VIEW_NAME,
      title: WEB_VIEW_TITLE,
    },
    parser: parseDBMLToJSON,
    fileExt: "dbml",
    supportsDbmlFileSync: true,
    diagnosticSourceId: "dbml-erd-visualizer",
  });
};

export function deactivate(): void {}
