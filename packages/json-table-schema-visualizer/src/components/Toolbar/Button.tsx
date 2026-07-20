import { type ButtonHTMLAttributes } from "react";

import { composeTooltip } from "@/utils/composeTooltip";

interface ToolbarButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  onClick: () => void;
  /** Human-readable name. Becomes the accessible name and the tooltip text. */
  label: string;
  /** Registry key for this action, when it has one. */
  shortcutKey?: string;
}

const ToolbarButton = ({
  onClick,
  label,
  shortcutKey,
  children,
  className = "",
  ...props
}: ToolbarButtonProps) => {
  const tooltip = composeTooltip(label, shortcutKey);

  return (
    <button
      // No `title`: the native tooltip lags ~1s and would appear on top of
      // ours. aria-label carries the accessible name in its place, which an
      // icon-only button would otherwise lack entirely — and it carries the
      // shortcut too, so a screen-reader user learns the key like everyone else.
      aria-label={tooltip}
      onClick={onClick}
      className={`group relative flex items-center p-1 text-gray-800 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200 ${className}`}
      {...props}
    >
      {children}

      <span
        // Hidden from assistive tech: it repeats the accessible name verbatim,
        // and announcing it twice is noise. It is a purely visual affordance.
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-900"
      >
        {tooltip}
      </span>
    </button>
  );
};

export default ToolbarButton;
