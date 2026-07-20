import { DownloadIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { t } from "@/i18n/t";

interface ExportButtonProps {
  onDownload: () => void;
}

const ExportButton = ({ onDownload }: ExportButtonProps) => {
  return (
    <ToolbarButton onClick={onDownload} title={t("action.exportPng")}>
      <DownloadIcon />
    </ToolbarButton>
  );
};

export default ExportButton;
