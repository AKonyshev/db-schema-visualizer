import PropTypes from "prop-types";
import { KeyboardIcon } from "lucide-react";

import AutoArrangeTableButton from "./AutoArrage/AutoArrangeTables";
import ThemeToggler from "./ThemeToggler/ThemeToggler";
import DetailLevelToggle from "./DetailLevelToggle/DetailLevelToggle";
import FitToViewButton from "./FitToView/FitToView";
import ExportButton from "./Export/Export";
import ExportSvgBtn from "./ExportSvg/ExportSvgBtn";
import ExportAdocBtn from "./ExportAdoc/ExportAdocBtn";
import ShortTableNameSetting from "./ShortTableNameSetting/ShortTableNameSetting";
import EnableAlwaysHover from "./EnableAlwaysHover/EnableAlwaysHover";
import AnimateRelations from "./AnimateRelations/AnimateRelations";
import ToolbarButton from "./Button";

const Toolbar = ({
  onFitToView,
  onDownloadPng,
  onDownloadSvg,
  onDownloadAdoc,
  onShowLegend,
}: {
  onFitToView: () => void;
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onDownloadAdoc: () => void;
  onShowLegend: () => void;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 absolute [&_svg]:w-5 [&_svg]:h-5 px-6 py-1 bottom-14 text-sm bg-gray-100 dark:bg-gray-700 shadow-lg rounded-2xl max-w-[95vw]">
      <AutoArrangeTableButton />
      <DetailLevelToggle />
      <FitToViewButton onClick={onFitToView} />
      <hr className="mx-2 my-1 w-px h-6 bg-gray-300" />
      <ExportButton onDownload={onDownloadPng} />
      <ExportSvgBtn onClick={onDownloadSvg} />
      <ExportAdocBtn onClick={onDownloadAdoc} />
      <hr className="mx-2 my-1 w-px h-6 bg-gray-300" />
      <ShortTableNameSetting />
      <EnableAlwaysHover />
      <AnimateRelations />
      <hr className="mx-2 my-1 w-px h-6 bg-gray-300" />
      <ToolbarButton title="Keyboard shortcuts" onClick={onShowLegend}>
        <KeyboardIcon />
      </ToolbarButton>
      <ThemeToggler />
    </div>
  );
};

Toolbar.propTypes = {
  onFitToView: PropTypes.func.isRequired,
};

export default Toolbar;
