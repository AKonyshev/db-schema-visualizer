import { useEffect, useRef } from "react";
import { upsertMetaInfoInDbml } from "dbml-to-json-table-schema";
import { tableCoordsStore } from "json-table-schema-visualizer/src/stores/tableCoords";
import eventEmitter from "json-table-schema-visualizer/src/events-emitter";

import {
  WebviewCommand,
  type WebviewPostMessage,
} from "../../extension/types/webviewCommand";
import { postToExtension } from "../vscodeApi";

const DEBOUNCE_MS = 400;

export const useDbmlMetaInfoSync = (
  enabled: boolean,
  rawContent: string | null,
  documentKey: string | null,
): void => {
  const rawContentRef = useRef(rawContent);
  const documentKeyRef = useRef(documentKey);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  rawContentRef.current = rawContent;
  documentKeyRef.current = documentKey;

  useEffect(() => {
    if (!enabled) return;

    const syncMetaInfo = (): void => {
      const content = rawContentRef.current;
      const uri = documentKeyRef.current;
      if (content == null || uri == null) return;

      // Whatever the reader has arranged, at whichever detail level: the
      // entries carry the level with them, so the file can be read back safely.
      // Nothing to write only when there is no diagram yet — an empty list
      // would replace the file's layout block with an empty one.
      const coords = tableCoordsStore.getCoordEntriesForMetaInfo();
      if (coords.length === 0) return;

      const updated = upsertMetaInfoInDbml(content, coords);

      if (updated === content) return;

      const message: WebviewPostMessage = {
        command: WebviewCommand.UPDATE_DBML_CONTENT,
        content: updated,
        documentUri: uri,
      };

      postToExtension(message);
    };

    const scheduleSync = (): void => {
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(syncMetaInfo, DEBOUNCE_MS);
    };

    eventEmitter.on("table:coords:updated", scheduleSync);

    return () => {
      eventEmitter.off("table:coords:updated", scheduleSync);
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled]);
};
