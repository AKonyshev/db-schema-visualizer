/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Diagnostic,
  DiagnosticSeverity,
  type Disposable,
  type ExtensionContext,
  languages,
  Position,
  Range,
  type TextDocument,
  type TextEditor,
  Uri,
  ViewColumn,
  type WebviewPanel,
  window,
  workspace,
} from "vscode";
import { type JSONTableSchema } from "shared/types/tableSchema";
import { DiagnosticError } from "shared/types/diagnostic";

import { DIAGRAM_UPDATER_DEBOUNCE_TIME } from "../constants";
import { ExtensionConfig } from "../helper/extensionConfigs";
import { type ExtensionRenderProps } from "../types";

import { WebviewHelper } from "./helper";

export class MainPanel {
  public static currentPanel: MainPanel | undefined;
  private static lastPublishedDocumentUri: Uri | undefined;
  private static webviewReady = false;
  private static outboundQueue: unknown[] = [];
  private readonly _panel: WebviewPanel;
  public static extensionConfig: ExtensionConfig;
  private readonly _disposables: Disposable[] = [];
  private _lastTimeout: NodeJS.Timeout | null = null;
  public static parseCode: (code: string) => JSONTableSchema;
  public static fileExt: string;
  public static supportsDbmlFileSync = false;
  public static isApplyingMetaInfoEdit = false;
  public static diagnosticCollection =
    languages.createDiagnosticCollection("dbml");

  private constructor(
    panel: WebviewPanel,
    context: ExtensionContext,
    extensionConfigSession: string,
    renderProps: ExtensionRenderProps,
  ) {
    this._panel = panel;
    MainPanel.webviewReady = false;
    MainPanel.outboundQueue = [];

    this._panel.onDidDispose(
      () => {
        this.dispose();
      },
      null,
      this._disposables,
    );

    this._panel.onDidChangeViewState(
      (event) => {
        if (event.webviewPanel.visible) {
          MainPanel.republishLastSchema();
        }
      },
      null,
      this._disposables,
    );

    const extensionConfig = new ExtensionConfig(extensionConfigSession);
    MainPanel.extensionConfig = extensionConfig;

    const defaultPageConfig = {
      ...extensionConfig.getDefaultPageConfig(),
      supportsDbmlFileSync: renderProps.supportsDbmlFileSync === true,
    };

    const html = WebviewHelper.setupHtml(
      this._panel.webview,
      context,
      defaultPageConfig,
    );

    this._panel.webview.html = html;

    WebviewHelper.setupWebviewHooks(
      this._panel.webview,
      extensionConfig,
      this._disposables,
      {
        fileExt: renderProps.fileExt,
        supportsDbmlFileSync: renderProps.supportsDbmlFileSync === true,
        onApplyingDbmlEdit: (applying) => {
          MainPanel.isApplyingMetaInfoEdit = applying;
        },
        onWebviewReady: () => {
          MainPanel.markWebviewReady();
        },
      },
    );
  }

  private static postToWebview(message: unknown): void {
    if (MainPanel.currentPanel == null) {
      return;
    }

    if (!MainPanel.webviewReady) {
      MainPanel.outboundQueue.push(message);
      return;
    }

    void MainPanel.currentPanel._panel.webview.postMessage(message);
  }

  private static markWebviewReady(): void {
    MainPanel.webviewReady = true;

    if (MainPanel.currentPanel == null) {
      return;
    }

    for (const message of MainPanel.outboundQueue) {
      void MainPanel.currentPanel._panel.webview.postMessage(message);
    }
    MainPanel.outboundQueue = [];

    MainPanel.republishLastSchema();
  }

  public static republishLastSchema(): void {
    const uri = MainPanel.lastPublishedDocumentUri;
    if (uri == null) return;

    void workspace.openTextDocument(uri).then((doc) => {
      MainPanel.publishSchema(doc);
    });
  }

  public static registerDiagramUpdaterOnfFileChange(): void {
    const disposable = workspace.onDidChangeTextDocument(async (event) => {
      if (event.document.languageId !== MainPanel.fileExt) return;
      if (MainPanel.isApplyingMetaInfoEdit) return;

      if (MainPanel.currentPanel?._lastTimeout !== null) {
        clearTimeout(MainPanel.currentPanel?._lastTimeout);
      }

      if (MainPanel.currentPanel !== undefined) {
        MainPanel.currentPanel._lastTimeout = setTimeout(() => {
          MainPanel.publishSchema(event.document);
        }, DIAGRAM_UPDATER_DEBOUNCE_TIME);
      }
    });

    MainPanel.currentPanel?._disposables.push(disposable);
  }

  public static render(props: ExtensionRenderProps): void {
    MainPanel.parseCode = props.parser;
    MainPanel.fileExt = props.fileExt;
    MainPanel.supportsDbmlFileSync = props.supportsDbmlFileSync === true;

    const diagnosticId = props.diagnosticSourceId ?? props.fileExt;
    MainPanel.diagnosticCollection.dispose();
    MainPanel.diagnosticCollection =
      languages.createDiagnosticCollection(diagnosticId);

    const editor = window.activeTextEditor;
    if (editor == null) {
      void window.showErrorMessage("No active text editor found.");
      return;
    }

    const activeTextEditorColumn =
      window.activeTextEditor?.viewColumn ?? ViewColumn.One;

    const previewColumn = activeTextEditorColumn + 1;

    if (MainPanel.currentPanel != null) {
      MainPanel.currentPanel._panel.reveal(previewColumn);
    } else {
      const panel = window.createWebviewPanel(
        props.webviewConfig.name,
        props.webviewConfig.title,
        previewColumn,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            Uri.joinPath(props.context.extensionUri, "dist", "webview"),
          ],
        },
      );

      panel.iconPath = {
        dark: Uri.joinPath(
          props.context.extensionUri,
          "assets",
          "icons",
          "preview-dark.svg",
        ),
        light: Uri.joinPath(
          props.context.extensionUri,
          "assets",
          "icons",
          "preview.svg",
        ),
      };

      MainPanel.currentPanel = new MainPanel(
        panel,
        props.context,
        props.extensionConfigSession,
        props,
      );
      MainPanel.registerDiagramUpdaterOnfFileChange();
    }

    MainPanel.publishSchema(editor.document);
  }

  static getCurrentEditor(): TextEditor | undefined {
    const editor = window.activeTextEditor;
    if (editor == null) {
      void window.showErrorMessage("No active text editor found.");
      return;
    }

    return editor;
  }

  static publishSchema = (document: TextDocument): void => {
    MainPanel.lastPublishedDocumentUri = document.uri;
    const code = document.getText();
    try {
      const schema = MainPanel.parseCode(code);

      MainPanel.postToWebview({
        type: "setSchema",
        payload: schema,
        key: document.uri.toString(),
        rawContent: code,
      });

      MainPanel.diagnosticCollection.clear();
    } catch (error) {
      console.error(JSON.stringify(error));

      if (error instanceof DiagnosticError) {
        MainPanel.postToWebview({
          type: "setSchemaErrorMessage",
          message: `${error.message}\n Line : ${error.location.start.line}:${error.location.start.column}`,
          key: document.uri.toString(),
        });

        MainPanel.diagnosticCollection.set(document.uri, [
          new Diagnostic(
            new Range(
              new Position(
                error.location.start.line,
                error.location.start.column,
              ),
              new Position(error.location.end.line, error.location.end.column),
            ),
            error.message,
            DiagnosticSeverity.Error,
          ),
        ]);
      } else {
        void window.showErrorMessage(`${error as any}`);
      }
    }
  };

  public static postMessageToWebview(message: unknown): void {
    MainPanel.postToWebview(message);
  }

  public dispose(): void {
    MainPanel.webviewReady = false;
    MainPanel.outboundQueue = [];
    MainPanel.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length > 0) {
      const disposable = this._disposables.pop();
      if (disposable != null) {
        disposable.dispose();
      }
    }
  }
}
