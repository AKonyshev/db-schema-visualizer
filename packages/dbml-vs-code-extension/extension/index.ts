import {
  commands,
  languages,
  type ExtensionContext,
  type Uri,
  ViewColumn,
  window,
} from "vscode";
import { parseDBMLToJSON } from "dbml-to-json-table-schema";

import { DiagramEditorProvider } from "extension-shared/extension/views/diagramEditorProvider";
import { EXTENSION_CONFIG_SESSION, WEB_VIEW_NAME } from "@/extension/constants";
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
  const diagnostics = languages.createDiagnosticCollection(
    "dbml-erd-visualizer",
  );

  const { provider, registration } = DiagramEditorProvider.register(
    WEB_VIEW_NAME,
    {
      context,
      diagnostics,
      extensionConfigSession: EXTENSION_CONFIG_SESSION,
      parser: parseDBMLToJSON,
      fileExt: "dbml",
      supportsDbmlFileSync: true,
    },
  );

  // The diagram if one is open, otherwise the file in front of the user.
  const resolveDbmlUri = (): Uri | undefined => {
    const activeDiagram = provider.getActiveView();
    if (activeDiagram !== undefined) {
      return activeDiagram.uri;
    }

    const editor = window.activeTextEditor;
    if (editor?.document.languageId === "dbml") {
      return editor.document.uri;
    }

    void window.showErrorMessage("No active DBML file found.");
    return undefined;
  };

  const openDiagram = async (viewColumn: ViewColumn): Promise<void> => {
    const uri = resolveDbmlUri();
    if (uri === undefined) {
      return;
    }

    await commands.executeCommand("vscode.openWith", uri, WEB_VIEW_NAME, {
      viewColumn,
    });
  };

  context.subscriptions.push(
    registration,
    diagnostics,
    window.registerTreeDataProvider("dbml-erd-visualizer.panel", treeProvider),
    context.secrets.onDidChange(() => {
      treeProvider.refresh();
    }),
    commands.registerCommand("dbml-erd-visualizer.previewDiagrams", () => {
      void openDiagram(ViewColumn.Beside);
    }),
    commands.registerCommand(
      "dbml-erd-visualizer.previewDiagramsInPlace",
      () => {
        void openDiagram(ViewColumn.Active);
      },
    ),
    commands.registerCommand("dbml-erd-visualizer.showSource", () => {
      const view = provider.getActiveView();
      if (view === undefined) {
        return;
      }

      // `default` is the built-in text editor; opening it in the diagram's own
      // column is what replaces the tab instead of adding one.
      void commands.executeCommand("vscode.openWith", view.uri, "default", {
        viewColumn: view.viewColumn,
      });
    }),
    commands.registerCommand("dbml-erd-visualizer.toggleTableRefs", () => {
      provider.postToTargetView(
        { type: "toggleTableRefs" },
        window.activeTextEditor?.document.uri.toString(),
      );
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

export function deactivate(): void {}
