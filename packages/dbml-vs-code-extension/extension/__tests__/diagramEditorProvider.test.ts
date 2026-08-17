import { DiagramEditorProvider } from "extension-shared/extension/views/diagramEditorProvider";
import type { DiagramViewDeps } from "extension-shared/extension/views/diagramView";
import type { JSONTableSchema } from "shared/types/tableSchema";
import { window } from "vscode";

const emptySchema: JSONTableSchema = { refs: [], enums: [], tables: [] };

const makePanel = (active = false) => {
  const listeners: Record<string, (arg?: unknown) => void> = {};
  return {
    active,
    visible: true,
    viewColumn: 1,
    webview: {
      options: {},
      html: "",
      postMessage: jest.fn(),
      onDidReceiveMessage: jest.fn((handler: (message: unknown) => void) => {
        listeners.message = handler;
        return { dispose: jest.fn() };
      }),
    },
    onDidChangeViewState: jest.fn(),
    onDidDispose: jest.fn((handler: () => void) => {
      listeners.dispose = handler;
      return { dispose: jest.fn() };
    }),
    listeners,
  };
};

const makeDocument = (uri: string) => ({
  uri: { toString: () => uri },
  getText: () => "Table a {}",
});

const deps = (): DiagramViewDeps => ({
  context: { extensionUri: "ext" } as never,
  diagnostics: {
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    dispose: jest.fn(),
  } as never,
  extensionConfigSession: "dbmlERDPreviewer",
  parser: () => emptySchema,
  fileExt: "dbml",
  supportsDbmlFileSync: true,
});

beforeAll(() => {
  (globalThis as Record<string, unknown>).__getWebviewHtml__ = () =>
    "<html></html>";
});

describe("DiagramEditorProvider", () => {
  test("registers with retained context and one editor per document", () => {
    DiagramEditorProvider.register("dblm-preview-webview", deps());

    expect(window.registerCustomEditorProvider).toHaveBeenCalledWith(
      "dblm-preview-webview",
      expect.any(DiagramEditorProvider),
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false,
      },
    );
  });

  test("routes a message to the focused diagram", () => {
    const provider = new DiagramEditorProvider(deps());
    const idle = makePanel(false);
    const focused = makePanel(true);

    provider.resolveCustomTextEditor(
      makeDocument("file:///a.dbml") as never,
      idle as never,
    );
    provider.resolveCustomTextEditor(
      makeDocument("file:///b.dbml") as never,
      focused as never,
    );
    idle.listeners.message({ command: "WEBVIEW_READY" });
    focused.listeners.message({ command: "WEBVIEW_READY" });

    provider.postToTargetView({ type: "toggleTableRefs" });

    expect(focused.webview.postMessage).toHaveBeenCalledWith({
      type: "toggleTableRefs",
    });
    expect(idle.webview.postMessage).not.toHaveBeenCalledWith({
      type: "toggleTableRefs",
    });
  });

  test("routes to the diagram of the active text document when none is focused", () => {
    const provider = new DiagramEditorProvider(deps());
    const wanted = makePanel(false);
    const other = makePanel(false);

    provider.resolveCustomTextEditor(
      makeDocument("file:///a.dbml") as never,
      wanted as never,
    );
    provider.resolveCustomTextEditor(
      makeDocument("file:///b.dbml") as never,
      other as never,
    );
    wanted.listeners.message({ command: "WEBVIEW_READY" });
    other.listeners.message({ command: "WEBVIEW_READY" });

    provider.postToTargetView({ type: "toggleTableRefs" }, "file:///a.dbml");

    expect(wanted.webview.postMessage).toHaveBeenCalledWith({
      type: "toggleTableRefs",
    });
    expect(other.webview.postMessage).not.toHaveBeenCalledWith({
      type: "toggleTableRefs",
    });
  });

  test("forgets a view once its panel is gone", () => {
    const provider = new DiagramEditorProvider(deps());
    const panel = makePanel(true);

    provider.resolveCustomTextEditor(
      makeDocument("file:///a.dbml") as never,
      panel as never,
    );
    panel.listeners.dispose?.();

    expect(provider.getActiveView()).toBeUndefined();
  });
});
