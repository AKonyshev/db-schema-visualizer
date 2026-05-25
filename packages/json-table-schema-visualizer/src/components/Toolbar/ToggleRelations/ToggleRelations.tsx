import ToolbarButton from "../Button";

import { useTablesInfo } from "@/hooks/table";
import { tableRelationsVisibilityStore } from "@/stores/tableRelationsVisibilityStore";
import eventEmitter from "@/events-emitter";

interface ToggleRelationsProps {
  documentKey: string | null;
  singleTableName?: string;
}

const ToggleRelations = ({
  documentKey,
  singleTableName,
}: ToggleRelationsProps) => {
  const { hoveredTableName } = useTablesInfo();

  const handleToggle = () => {
    if (documentKey == null || documentKey === "") return;

    const tableToToggle = hoveredTableName ?? singleTableName;
    if (tableToToggle == null || tableToToggle === "") return;

    tableRelationsVisibilityStore.switchTo(documentKey);
    tableRelationsVisibilityStore.toggleTableRelations(tableToToggle);
    eventEmitter.emit("on:table:relations:toggle", tableToToggle);
  };

  return (
    <ToolbarButton
      onClick={handleToggle}
      title="Скрыть/показать связи у сущности (под курсором)"
    >
      <span className="text-xs">🔗</span>
    </ToolbarButton>
  );
};

export default ToggleRelations;
