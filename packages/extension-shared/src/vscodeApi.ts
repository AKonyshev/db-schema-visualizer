// The canonical shape, shared with the `window.vsCodeWebviewAPI` global. A
// narrower local copy used to live here, which made the API impossible to cache
// back onto `window` without a type error.
import { type WebviewApi } from "../globals";

let cachedApi: WebviewApi | undefined;

export const getVsCodeWebviewApi = (): WebviewApi | undefined => {
  if (cachedApi !== undefined) {
    return cachedApi;
  }

  if (window.vsCodeWebviewAPI !== undefined) {
    cachedApi = window.vsCodeWebviewAPI;
    return cachedApi;
  }

  if (typeof acquireVsCodeApi !== "function") {
    return undefined;
  }

  try {
    cachedApi = acquireVsCodeApi();
    window.vsCodeWebviewAPI = cachedApi;
    return cachedApi;
  } catch {
    return undefined;
  }
};

export const postToExtension = (message: unknown): void => {
  const api = getVsCodeWebviewApi();
  api?.postMessage(message);
};

export const initVsCodeWebviewApi = (): void => {
  getVsCodeWebviewApi();
};
