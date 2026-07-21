import { ExpandIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { shortcutKeyFor } from "@/constants/shortcuts";
import { t } from "@/i18n/t";

interface FitToViewButtonProps {
  onClick: () => void;
}

const FitToViewButton = ({ onClick }: FitToViewButtonProps) => {
  return (
    <ToolbarButton
      onClick={onClick}
      label={t("action.fitToView")}
      shortcutKey={shortcutKeyFor("fitToView")}
    >
      <ExpandIcon />
    </ToolbarButton>
  );
};

export default FitToViewButton;
