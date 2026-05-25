import { useState } from "react";
import PropTypes from "prop-types";

import AutoArrangeTableButton from "./AutoArrage/AutoArrangeTables";
import ThemeToggler from "./ThemeToggler/ThemeToggler";
import DetailLevelToggle from "./DetailLevelToggle/DetailLevelToggle";
import FitToViewButton from "./FitToView/FitToView";
import ExportButton from "./Export/Export";
import ExportSvgBtn from "./ExportSvg/ExportSvgBtn";
import ExportAdocBtn from "./ExportAdoc/ExportAdocBtn";
import ToggleRelations from "./ToggleRelations/ToggleRelations";
import ShortTableNameSetting from "./ShortTableNameSetting/ShortTableNameSetting";
import EnableAlwaysHover from "./EnableAlwaysHover/EnableAlwaysHover";

const Toolbar = ({
  onFitToView,
  onDownloadPng,
  onDownloadSvg,
  onDownloadAdoc,
  documentKey,
  singleTableName,
}: {
  onFitToView: () => void;
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onDownloadAdoc: () => void;
  documentKey: string | null;
  singleTableName?: string;
}) => {
  const [, setRefresh] = useState(0);
  const refresh = () => {
    setRefresh((n) => n + 1);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 absolute [&_svg]:w-5 [&_svg]:h-5 px-6 py-1 bottom-14 text-sm bg-gray-100 dark:bg-gray-700 shadow-lg rounded-2xl max-w-[95vw]">
      <AutoArrangeTableButton />
      <DetailLevelToggle />
      <FitToViewButton onClick={onFitToView} />
      <ToggleRelations
        documentKey={documentKey}
        singleTableName={singleTableName}
      />
      <hr className="mx-2 my-1 w-px h-6 bg-gray-300" />
      <ExportButton onDownload={onDownloadPng} />
      <ExportSvgBtn onClick={onDownloadSvg} />
      <ExportAdocBtn onClick={onDownloadAdoc} />
      <hr className="mx-2 my-1 w-px h-6 bg-gray-300" />
      <ShortTableNameSetting refresh={refresh} />
      <EnableAlwaysHover refresh={refresh} />
      <hr className="mx-2 my-1 w-px h-6 bg-gray-300" />
      <ThemeToggler />
    </div>
  );
};

Toolbar.propTypes = {
  onFitToView: PropTypes.func.isRequired,
};

export default Toolbar;
