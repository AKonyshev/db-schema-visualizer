import { ImageIcon } from "lucide-react";

import ToolbarButton from "../Button";

interface ExportSvgBtnProps {
  onClick: () => void;
}

const ExportSvgBtn = ({ onClick }: ExportSvgBtnProps) => {
  return (
    <ToolbarButton onClick={onClick} title="Export SVG">
      <ImageIcon />
    </ToolbarButton>
  );
};

export default ExportSvgBtn;
