import {
  type CustomTextEditorProvider,
  type Disposable,
  type TextDocument,
  type WebviewPanel,
  window,
} from "vscode";

import { DiagramView, type DiagramViewDeps } from "./diagramView";
import { pickTargetView } from "./pickTargetView";

export class DiagramEditorProvider implements CustomTextEditorProvider {
  // Keyed by document uri, which is sound only because registration passes
  // supportsMultipleEditorsPerDocument: false.
  private readonly views = new Map<string, DiagramView>();

  constructor(private readonly deps: DiagramViewDeps) {}

  public static register(
    viewType: string,
    deps: DiagramViewDeps,
  ): { provider: DiagramEditorProvider; registration: Disposable } {
    const provider = new DiagramEditorProvider(deps);

    return {
      provider,
      registration: window.registerCustomEditorProvider(viewType, provider, {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false,
      }),
    };
  }

  public resolveCustomTextEditor(
    document: TextDocument,
    panel: WebviewPanel,
  ): void {
    const key = document.uri.toString();
    this.views.get(key)?.dispose();

    const view = new DiagramView(panel, document, this.deps);
    this.views.set(key, view);

    panel.onDidDispose(() => {
      if (this.views.get(key) === view) {
        this.views.delete(key);
      }
      view.dispose();
    });
  }

  public getActiveView(): DiagramView | undefined {
    return pickTargetView([...this.views.values()]);
  }

  public postToTargetView(
    message: unknown,
    activeTextDocumentUri?: string,
  ): void {
    pickTargetView([...this.views.values()], activeTextDocumentUri)?.post(
      message,
    );
  }
}
