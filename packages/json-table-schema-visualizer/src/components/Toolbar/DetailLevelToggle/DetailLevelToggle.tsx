import { PanelsTopLeftIcon, PanelTopIcon, KeyRoundIcon } from "lucide-react";
import { useMemo } from "react";

import ToolbarButton from "../Button";

import { shortcutKeyFor } from "@/constants/shortcuts";
import { t } from "@/i18n/t";
import { useTableDetailLevel } from "@/hooks/tableDetailLevel";
import { TableDetailLevel } from "@/types/tableDetailLevel";

interface DetailLevelToggleProps {
  onClick: () => void;
}

// All three variants are the same action, so they share one key rather than
// each looking it up.
const DETAIL_LEVEL_SHORTCUT = shortcutKeyFor("detailLevel");

const FullDetailLevel = ({ onClick }: DetailLevelToggleProps) => {
  return (
    <ToolbarButton
      label={t("action.detailLevel.full")}
      shortcutKey={DETAIL_LEVEL_SHORTCUT}
      onClick={onClick}
    >
      <PanelsTopLeftIcon />

      <span className="ml-2">{t("action.detailLevel.full")}</span>
    </ToolbarButton>
  );
};
const HeaderOnlyLevel = ({ onClick }: DetailLevelToggleProps) => {
  return (
    <ToolbarButton
      label={t("action.detailLevel.header")}
      shortcutKey={DETAIL_LEVEL_SHORTCUT}
      onClick={onClick}
    >
      <PanelTopIcon />

      <span className="ml-2">{t("action.detailLevel.header")}</span>
    </ToolbarButton>
  );
};
const KeyOnlyLevel = ({ onClick }: DetailLevelToggleProps) => {
  return (
    <ToolbarButton
      label={t("action.detailLevel.key")}
      shortcutKey={DETAIL_LEVEL_SHORTCUT}
      onClick={onClick}
    >
      <KeyRoundIcon />

      <span className="ml-2">{t("action.detailLevel.key")}</span>
    </ToolbarButton>
  );
};

const COMPONENT_MAP = {
  [TableDetailLevel.FullDetails]: FullDetailLevel,
  [TableDetailLevel.HeaderOnly]: HeaderOnlyLevel,
  [TableDetailLevel.KeyOnly]: KeyOnlyLevel,
};

const DetailLevelToggle = () => {
  const { detailLevel, next } = useTableDetailLevel();
  const Component = useMemo(() => COMPONENT_MAP[detailLevel], [detailLevel]);

  return <Component onClick={next} />;
};

export default DetailLevelToggle;
