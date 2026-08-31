import { Maximize2Icon, Minimize2Icon } from "lucide-react";
import ToolbarButton from "json-table-schema-visualizer/src/components/Toolbar/Button";
import { t } from "json-table-schema-visualizer/src/i18n/t";

interface ExpandButtonProps {
  expanded: boolean;
  onToggle: () => void;
}

/**
 * The frame's one host-specific action, in the toolbar's `hostActions` slot.
 *
 * Rendered only when a host has answered, so there is no disabled state and no
 * explaining why the button is there but inert — see `useHostExpand`.
 */
const ExpandButton = ({ expanded, onToggle }: ExpandButtonProps) => (
  <ToolbarButton
    label={t(expanded ? "action.collapseFrame" : "action.expandFrame")}
    onClick={onToggle}
  >
    {expanded ? <Minimize2Icon /> : <Maximize2Icon />}
  </ToolbarButton>
);

export default ExpandButton;
