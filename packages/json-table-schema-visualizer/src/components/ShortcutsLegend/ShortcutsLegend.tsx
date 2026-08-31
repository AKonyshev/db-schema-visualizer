import { useEffect } from "react";

import { t } from "@/i18n/t";
import { SHORTCUTS } from "@/constants/shortcuts";

interface ShortcutsLegendProps {
  onClose: () => void;
}

const ShortcutsLegend = ({ onClose }: ShortcutsLegendProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        // See `ExportMenu`: an Escape that closed this is not an Escape going
        // spare.
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="min-w-[320px] rounded-2xl border border-subtle bg-surface-raised p-6 shadow-2xl shadow-black/20"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <h2 className="mb-4 text-sm font-semibold text-content">
          {t("legend.title")}
        </h2>

        <ul className="flex flex-col gap-2">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.id}
              className="flex items-center justify-between gap-6 text-xs text-content"
            >
              <span>{t(shortcut.labelKey)}</span>
              <kbd className="rounded-md border border-subtle bg-surface-sunken px-2 py-1 font-mono text-content-muted">
                {shortcut.key}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ShortcutsLegend;
