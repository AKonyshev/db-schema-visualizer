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

  return null;
};

export default DbmlFileSyncEffects;
