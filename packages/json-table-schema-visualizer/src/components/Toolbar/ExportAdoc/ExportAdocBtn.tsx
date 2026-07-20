import { LayoutPanelLeftIcon } from "lucide-react";

import ToolbarButton from "../Button";

interface ExportAdocBtnProps {
  onClick: () => void;
}

const ExportAdocBtn = ({ onClick }: ExportAdocBtnProps) => {
  return (
    <ToolbarButton onClick={onClick} title="Export AsciiDoc">
      <LayoutPanelLeftIcon />
    </ToolbarButton>
  );
};

export default ExportAdocBtn;
