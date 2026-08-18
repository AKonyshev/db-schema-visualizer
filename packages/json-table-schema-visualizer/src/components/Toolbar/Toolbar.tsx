import PropTypes from "prop-types";
import { KeyboardIcon } from "lucide-react";

import AutoArrangeTableButton from "./AutoArrage/AutoArrangeTables";
import ThemeToggler from "./ThemeToggler/ThemeToggler";
import DetailLevelToggle from "./DetailLevelToggle/DetailLevelToggle";
import FitToViewButton from "./FitToView/FitToView";
import ExportMenu from "./Export/ExportMenu";
import ShortTableNameSetting from "./ShortTableNameSetting/ShortTableNameSetting";
import EnableAlwaysHover from "./EnableAlwaysHover/EnableAlwaysHover";
import AnimateRelations from "./AnimateRelations/AnimateRelations";
import RelationStyleToggle from "./RelationStyleToggle/RelationStyleToggle";
import ToolbarButton from "./Button";

import { shortcutKeyFor } from "@/constants/shortcuts";
import { t } from "@/i18n/t";

const Toolbar = ({
  onFitToView,
  onDownloadPng,
  onDownloadSvg,
  onDownloadAdoc,
  onDownloadMarkdown,
  onShowLegend,
}: {
  onFitToView: () => void;
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onDownloadAdoc: () => void;
  onDownloadMarkdown: () => void;
  onShowLegend: () => void;
}) => {
  return (
    // Centred explicitly. It used to be centred by the flex container above it —
    // an absolutely positioned child of a flex parent is placed at the static
    // position `items-center` gives it — which meant the toolbar's alignment
    // depended on a rule about a parent it does not name. Wrapping the diagram
    // in a plain block was enough to stretch it edge to edge.
    //
    // `max-w-full` rather than a viewport width, so a narrow pane clips the
    // toolbar's own box rather than letting it run past the diagram.
    <div className="absolute bottom-14 left-1/2 flex w-max max-w-full -translate-x-1/2 flex-wrap items-center gap-2 rounded-2xl bg-gray-100 px-6 py-1 text-sm shadow-lg dark:bg-gray-700 [&_svg]:h-5 [&_svg]:w-5">
      <AutoArrangeTableButton />
      <DetailLevelToggle />
      <FitToViewButton onClick={onFitToView} />
      <hr className="mx-2 my-1 w-px h-6 bg-gray-300" />
      <ExportMenu
        onDownloadPng={onDownloadPng}
        onDownloadSvg={onDownloadSvg}
        onDownloadAdoc={onDownloadAdoc}
        onDownloadMarkdown={onDownloadMarkdown}
      />
      <hr className="mx-2 my-1 w-px h-6 bg-gray-300" />
      <ShortTableNameSetting />
      <EnableAlwaysHover />
      <AnimateRelations />
      <RelationStyleToggle />
      <hr className="mx-2 my-1 w-px h-6 bg-gray-300" />
      <ToolbarButton
        label={t("legend.title")}
        shortcutKey={shortcutKeyFor("legend")}
        onClick={onShowLegend}
      >
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
