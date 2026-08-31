// The viewType of the diagram editor. The webview keeps table positions in
// localStorage keyed by this name, so changing it reads as a brand new webview
// and drops that cache; it was changed once, when the extension was republished
// under its own identity, and there is no reason to change it again. MetaInfo
// in the file is the durable copy of a layout — this is only the cache.
export const WEB_VIEW_NAME = "dbml-studio-diagram";

export const EXTENSION_CONFIG_SESSION = "dbmlStudio";
