import { HandIcon, MousePointer2Icon } from "lucide-react";

import ToolbarButton from "../Button";

import { shortcutKeyFor } from "@/constants/shortcuts";
import { useIsSelectMode } from "@/hooks/selection";
import { t } from "@/i18n/t";
import { toggleInteractionMode } from "@/stores/interactionModeStore";

/**
 * Whether a drag moves the canvas or catches tables.
 *
 * The icon shows the mode in force rather than the one a click would bring, the
 * way the relation-style and theme toggles read. This one has more riding on
 * being visible than those do: a reader who cannot see which mode they are in
 * has a canvas that will not pan for reasons nothing on screen explains, so the
 * label is shown beside the icon in both states rather than in only one.
 */
const InteractionModeToggle = () => {
  const isSelect = useIsSelectMode();

  return (
    <ToolbarButton
      label={
        isSelect
          ? t("action.interactionMode.select")
          : t("action.interactionMode.pan")
      }
      shortcutKey={shortcutKeyFor("interactionMode")}
      aria-pressed={isSelect}
      onClick={toggleInteractionMode}
    >
      {isSelect ? <MousePointer2Icon /> : <HandIcon />}

      <span className="ml-2">
        {isSelect
          ? t("action.interactionMode.select.compact")
          : t("action.interactionMode.pan.compact")}
      </span>
    </ToolbarButton>
  );
};

export default InteractionModeToggle;
