import { SplineIcon, WaypointsIcon } from "lucide-react";

import ToolbarButton from "../Button";

import { STORAGE_KEYS } from "@/constants/storageKeys";
import { t } from "@/i18n/t";
import useLocalStorage from "@/hooks/localStorage";
import { DEFAULT_RELATION_STYLE, RelationStyle } from "@/types/relationStyle";

/**
 * Right angles or curves.
 *
 * Two states rather than a list, and the icon shows the style in force rather
 * than the one a click would bring — the same way the theme toggle reads.
 */
const RelationStyleToggle = () => {
  const [style, setStyle] = useLocalStorage<RelationStyle>(
    STORAGE_KEYS.RELATION_STYLE,
    DEFAULT_RELATION_STYLE,
  );

  const isOrthogonal = style !== RelationStyle.Bezier;

  return (
    <ToolbarButton
      label={
        isOrthogonal
          ? t("action.relationStyle.orthogonal")
          : t("action.relationStyle.bezier")
      }
      aria-pressed={isOrthogonal}
      onClick={() => {
        setStyle((prev) =>
          prev === RelationStyle.Bezier
            ? RelationStyle.Orthogonal
            : RelationStyle.Bezier,
        );
      }}
    >
      {isOrthogonal ? <WaypointsIcon /> : <SplineIcon />}

      <span className="ml-2">
        {isOrthogonal
          ? t("action.relationStyle.orthogonal.compact")
          : t("action.relationStyle.bezier.compact")}
      </span>
    </ToolbarButton>
  );
};

export default RelationStyleToggle;
