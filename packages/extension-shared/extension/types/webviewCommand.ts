import { type JSONTableSchema } from "shared/types/tableSchema";

export enum WebviewCommand {
  SET_THEME_PREFERENCES = "SET_THEME_PREFERENCES",
  UPDATE_DBML_CONTENT = "UPDATE_DBML_CONTENT",
  SAVE_EXPORT = "SAVE_EXPORT",
  WEBVIEW_READY = "WEBVIEW_READY",
}

export interface WebviewPostMessage {
  command: WebviewCommand;
  message?: string;
  content?: string;
  documentUri?: string;
  data?: string;
  filename?: string;
  mimeType?: string;
}

export interface SetSchemaCommandPayload {
  type: string;
  payload: JSONTableSchema;
  message?: string;
  key: string;
  rawContent?: string;
}
