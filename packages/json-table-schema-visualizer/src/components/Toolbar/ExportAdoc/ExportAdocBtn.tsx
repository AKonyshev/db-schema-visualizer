import { LayoutPanelLeftIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { t } from "@/i18n/t";

interface ExportAdocBtnProps {
  onClick: () => void;
}

const ExportAdocBtn = ({ onClick }: ExportAdocBtnProps) => {
  return (
    <ToolbarButton onClick={onClick} title={t("action.exportAdoc")}>
      <LayoutPanelLeftIcon />
    </ToolbarButton>
  );
};

export default ExportAdocBtn;
