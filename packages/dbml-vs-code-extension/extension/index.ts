import { commands, type ExtensionContext } from "vscode";
import { parseDBMLToJSON } from "dbml-to-json-table-schema";

import { MainPanel } from "extension-shared/extension/views/panel";
import {
  EXTENSION_CONFIG_SESSION,
  WEB_VIEW_NAME,
  WEB_VIEW_TITLE,
} from "@/extension/constants";

export function activate(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand(
      "dbml-erd-visualizer.previewDiagrams",
      async () => {
        lunchExtension(context);
      },
    ),
    commands.registerCommand("dbml-erd-visualizer.toggleTableRefs", () => {
      MainPanel.postMessageToWebview({ type: "toggleTableRefs" });
    }),
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
