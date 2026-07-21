interface VsCodeWebviewApi {
  postMessage: (message: unknown) => void;
}

let cachedApi: VsCodeWebviewApi | undefined;

export const getVsCodeWebviewApi = (): VsCodeWebviewApi | undefined => {
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
