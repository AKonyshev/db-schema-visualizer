import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { type JSONTableSchema } from "shared/types/tableSchema";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";
import { stageStateStore } from "json-table-schema-visualizer/src/stores/stagesState";
import { detailLevelStore } from "json-table-schema-visualizer/src/stores/detailLevelStore";
import { tableRelationsVisibilityStore } from "json-table-schema-visualizer/src/stores/tableRelationsVisibilityStore";

import {
  WebviewCommand,
  type SetSchemaCommandPayload,
  type WebviewPostMessage,
} from "../../extension/types/webviewCommand";
import { postToExtension } from "../vscodeApi";

const readBootstrapSchema = (): {
  schema: JSONTableSchema | null;
  key: string | null;
  schemaErrorMessage: string | null;
  rawContent: string | null;
} => {
  const schemaMessage = window.__SCHEMA_BOOTSTRAP__;
  const errorMessage = window.__SCHEMA_ERROR_BOOTSTRAP__;

  if (
    errorMessage?.type === "setSchemaErrorMessage" &&
    typeof errorMessage.message === "string"
  ) {
    return {
      schema: null,
      key: typeof errorMessage.key === "string" ? errorMessage.key : null,
      schemaErrorMessage: errorMessage.message,
      rawContent: null,
    };
  }

  if (
    schemaMessage?.type === "setSchema" &&
    schemaMessage.payload != null &&
    typeof schemaMessage.payload === "object"
  ) {
    return {
      schema: schemaMessage.payload,
      key: typeof schemaMessage.key === "string" ? schemaMessage.key : null,
      schemaErrorMessage: null,
      rawContent:
        typeof schemaMessage.rawContent === "string"
          ? schemaMessage.rawContent
          : null,
    };
  }

  return {
    schema: null,
    key: null,
    schemaErrorMessage: null,
    rawContent: null,
  };
};

const applySchemaMessage = (
  message: SetSchemaCommandPayload,
  schemaKeyRef: MutableRefObject<string | null>,
  setters: {
    setSchema: (schema: JSONTableSchema | null) => void;
    setSchemaKey: (key: string | null) => void;
    setSchemaErrorMessage: (message: string | null) => void;
    setRawContent: (content: string | null) => void;
  },
): void => {
  if (
    message.type === "setSchemaErrorMessage" &&
    typeof message.message === "string"
  ) {
    setters.setSchemaErrorMessage(message.message);
    setters.setSchema(null);
    return;
  }

  if (!(message.type === "setSchema" && message.payload != null)) {
    return;
  }

  const currentKey = schemaKeyRef.current;
  if (message.key !== currentKey) {
    tableCoordsStore.switchTo(
      message.key,
      message.payload.tables,
      message.payload.refs,
    );
    stageStateStore.switchTo(message.key);
    detailLevelStore.switchTo(message.key);
    tableRelationsVisibilityStore.switchTo(message.key);
    schemaKeyRef.current = message.key;
    setters.setSchemaKey(message.key);
  }

  setters.setSchema(message.payload);
  setters.setSchemaErrorMessage(null);
  if (typeof message.rawContent === "string") {
    setters.setRawContent(message.rawContent);
  }
};

export const useSchema = (): {
  schema: JSONTableSchema | null;
  key: string | null;
  schemaErrorMessage: string | null;
  rawContent: string | null;
} => {
  const bootstrap = readBootstrapSchema();
  const [schemaErrorMessage, setSchemaErrorMessage] = useState<string | null>(
    bootstrap.schemaErrorMessage,
  );
  const [schema, setSchema] = useState<JSONTableSchema | null>(
    bootstrap.schema,
  );
  const [schemaKey, setSchemaKey] = useState<string | null>(bootstrap.key);
  const [rawContent, setRawContent] = useState<string | null>(
    bootstrap.rawContent,
  );
  const schemaKeyRef = useRef<string | null>(bootstrap.key);

  useLayoutEffect(() => {
    if (bootstrap.schema != null && bootstrap.key != null) {
      tableCoordsStore.switchTo(
        bootstrap.key,
        bootstrap.schema.tables,
        bootstrap.schema.refs,
      );
      stageStateStore.switchTo(bootstrap.key);
      detailLevelStore.switchTo(bootstrap.key);
      tableRelationsVisibilityStore.switchTo(bootstrap.key);
    }
  }, []);

  useEffect(() => {
    schemaKeyRef.current = schemaKey;
  }, [schemaKey]);

  useEffect(() => {
    const updater = (e: MessageEvent): void => {
      applySchemaMessage(e.data as SetSchemaCommandPayload, schemaKeyRef, {
        setSchema,
        setSchemaKey,
        setSchemaErrorMessage,
        setRawContent,
      });
    };

    window.addEventListener("message", updater);

    const readyMessage: WebviewPostMessage = {
      command: WebviewCommand.WEBVIEW_READY,
    };
    postToExtension(readyMessage);

    return () => {
      window.removeEventListener("message", updater);
      tableCoordsStore.saveCurrentStore();
    };
  }, []);

  return { schema, key: schemaKey, schemaErrorMessage, rawContent };
};
