import { type DefaultPageConfig } from "@/extension/types/defaultPageConfig";
import { type SetSchemaCommandPayload } from "@/extension/types/webviewCommand";

export interface WebviewApi<StateType = unknown> {
  postMessage: (message: unknown) => void;
  getState: () => StateType | undefined;
  setState: <T extends StateType | undefined>(newState: T) => T;
}

declare function acquireVsCodeApi<StateType>(): WebviewApi<StateType>;

declare global {
  interface Window {
    EXTENSION_DEFAULT_CONFIG?: DefaultPageConfig;
    vsCodeWebviewAPI?: WebviewApi;
    __SCHEMA_BOOTSTRAP__?: SetSchemaCommandPayload | null;
    __SCHEMA_ERROR_BOOTSTRAP__?: SetSchemaCommandPayload | null;
  }
}

declare module NodeJS {
  interface Global {
    __getWebviewHtml__: (webview: Webview, context: ExtensionContext) => string;
    __getWebviewHtml__: (url: string) => string;
  }
}
