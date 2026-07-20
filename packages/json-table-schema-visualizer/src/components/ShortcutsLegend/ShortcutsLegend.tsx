import { useEffect } from "react";

import { SHORTCUTS } from "@/constants/shortcuts";

interface ShortcutsLegendProps {
  onClose: () => void;
}

const ShortcutsLegend = ({ onClose }: ShortcutsLegendProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
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
        className="min-w-[320px] rounded-2xl bg-gray-100 p-6 shadow-lg dark:bg-gray-700"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
          Keyboard shortcuts
        </h2>

        <ul className="flex flex-col gap-2">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.id}
              className="flex items-center justify-between gap-6 text-xs text-gray-800 dark:text-gray-200"
            >
              <span>{shortcut.label}</span>
              <kbd className="rounded bg-gray-300 px-2 py-1 font-mono dark:bg-gray-800">
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
