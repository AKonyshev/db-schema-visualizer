import { ExpandIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { t } from "@/i18n/t";

interface FitToViewButtonProps {
  onClick: () => void;
}

const FitToViewButton = ({ onClick }: FitToViewButtonProps) => {
  return (
    <ToolbarButton onClick={onClick} title={t("action.fitToView")}>
      <ExpandIcon />
      <span className="ml-2">{t("action.fitToView")}</span>
    </ToolbarButton>
  );
};

export default FitToViewButton;
