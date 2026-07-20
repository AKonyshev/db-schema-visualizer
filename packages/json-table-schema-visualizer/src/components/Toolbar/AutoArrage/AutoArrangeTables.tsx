import { LayoutPanelLeftIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { t } from "@/i18n/t";
import { useTablePositionContext } from "@/hooks/table";

const AutoArrangeTableButton = () => {
  const { resetPositions } = useTablePositionContext();

  return (
    <ToolbarButton onClick={resetPositions} title={t("action.autoArrange")}>
      <LayoutPanelLeftIcon />

      <span className="ml-2">{t("action.autoArrange")}</span>
    </ToolbarButton>
  );
};

export default AutoArrangeTableButton;
