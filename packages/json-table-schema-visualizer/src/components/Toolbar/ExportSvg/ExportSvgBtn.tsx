import { ImageIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { t } from "@/i18n/t";

interface ExportSvgBtnProps {
  onClick: () => void;
}

const ExportSvgBtn = ({ onClick }: ExportSvgBtnProps) => {
  return (
    <ToolbarButton onClick={onClick} title={t("action.exportSvg")}>
      <ImageIcon />
    </ToolbarButton>
  );
};

export default ExportSvgBtn;
