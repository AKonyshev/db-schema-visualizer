import ToggleRefsShortcut from "json-table-schema-visualizer/src/components/ToggleRefsShortcut";

import { useDbmlMetaInfoSync } from "../hooks/dbmlMetaInfoSync";
import { useToggleTableRefsCommand } from "../hooks/toggleTableRefsCommand";

interface DbmlFileSyncEffectsProps {
  rawContent: string | null;
  documentKey: string | null;
  singleTableName?: string;
}

const DbmlFileSyncEffects = ({
  rawContent,
  documentKey,
  singleTableName,
}: DbmlFileSyncEffectsProps) => {
  useDbmlMetaInfoSync(true, rawContent, documentKey);
  useToggleTableRefsCommand(true, rawContent, documentKey, singleTableName);

  return (
    <ToggleRefsShortcut
      onToggle={() => {
        window.postMessage({ type: "toggleTableRefs" }, "*");
      }}
    />
  );
};

export default DbmlFileSyncEffects;
