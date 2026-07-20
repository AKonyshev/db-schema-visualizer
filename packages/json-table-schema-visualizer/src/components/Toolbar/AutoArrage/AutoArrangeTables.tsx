import { LayoutPanelLeftIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { shortcutKeyFor } from "@/constants/shortcuts";
import { t } from "@/i18n/t";
import { useTablePositionContext } from "@/hooks/table";

const AutoArrangeTableButton = () => {
  const { resetPositions } = useTablePositionContext();

  return (
    <ToolbarButton
      onClick={resetPositions}
      label={t("action.autoArrange")}
      shortcutKey={shortcutKeyFor("autoArrange")}
    >
      <LayoutPanelLeftIcon />

      <span className="ml-2">{t("action.autoArrange")}</span>
    </ToolbarButton>
  );
};

export default AutoArrangeTableButton;
