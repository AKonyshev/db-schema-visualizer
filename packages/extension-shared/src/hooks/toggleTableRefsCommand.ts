import { useEffect, useRef } from "react";
import { toggleTableRefs } from "dbml-to-json-table-schema";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";
import { useTablesInfo } from "json-table-schema-visualizer/src/hooks/table";

import {
  WebviewCommand,
  type WebviewPostMessage,
} from "../../extension/types/webviewCommand";
import { postToExtension } from "../vscodeApi";

import type { TablesInfoProviderValue } from "json-table-schema-visualizer/src/types/tablesInfoProviderValue";

interface ToggleTableRefsHostMessage {
  type: "toggleTableRefs";
}

export const useToggleTableRefsCommand = (
  enabled: boolean,
  rawContent: string | null,
  documentKey: string | null,
  singleTableName?: string,
): void => {
  const tablesInfo: TablesInfoProviderValue = useTablesInfo();
  const rawContentRef = useRef(rawContent);
  const documentKeyRef = useRef(documentKey);
  const hoveredTableRef = useRef<string | null>(tablesInfo.hoveredTableName);
  const singleTableRef = useRef<string | undefined>(singleTableName);

  rawContentRef.current = rawContent;
  documentKeyRef.current = documentKey;
  hoveredTableRef.current = tablesInfo.hoveredTableName;
  singleTableRef.current = singleTableName;

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: MessageEvent): void => {
      const message = event.data as ToggleTableRefsHostMessage;
      if (message.type !== "toggleTableRefs") return;

      const content = rawContentRef.current;
      const uri = documentKeyRef.current;
      if (content == null || uri == null) return;

      const tableName = hoveredTableRef.current ?? singleTableRef.current;
      if (tableName == null || tableName === "") return;

      const coords = tableCoordsStore.getCoords(tableName);
      const updated = toggleTableRefs(content, tableName, {
        name: tableName,
        x: coords.x,
        y: coords.y,
      });

      const postMessage: WebviewPostMessage = {
        command: WebviewCommand.UPDATE_DBML_CONTENT,
        content: updated,
        documentUri: uri,
      };

      postToExtension(postMessage);
    };

    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
    };
  }, [enabled]);
};
