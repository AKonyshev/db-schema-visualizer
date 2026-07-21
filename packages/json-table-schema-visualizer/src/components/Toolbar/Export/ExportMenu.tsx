import { DownloadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import ToolbarButton from "../Button";

import { type MessageKey } from "@/i18n/messages";
import { t } from "@/i18n/t";

interface ExportMenuProps {
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onDownloadAdoc: () => void;
}

const ExportMenu = ({
  onDownloadPng,
  onDownloadSvg,
  onDownloadAdoc,
}: ExportMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Esc and click-outside, mirroring ShortcutsLegend so the app has one way of
  // dismissing a popup rather than two.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    const onPointerDown = (event: MouseEvent): void => {
      const container = containerRef.current;
      if (container != null && !container.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [isOpen]);

  const items: Array<{ labelKey: MessageKey; run: () => void }> = [
    { labelKey: "action.exportPng", run: onDownloadPng },
    { labelKey: "action.exportSvg", run: onDownloadSvg },
    { labelKey: "action.exportAdoc", run: onDownloadAdoc },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <ToolbarButton
        label={t("action.export")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
      >
        <DownloadIcon />
      </ToolbarButton>

      {isOpen && (
        <div
          role="menu"
          className="absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 overflow-hidden rounded-lg bg-gray-100 shadow-lg dark:bg-gray-700"
        >
          {items.map((item) => (
            <button
              key={item.labelKey}
              role="menuitem"
              className="block w-full whitespace-nowrap px-4 py-2 text-left text-xs text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-600"
              onClick={() => {
                // Close first: the download itself may open a save dialog, and
                // leaving the menu behind it looks like a stuck interface.
                setIsOpen(false);
                item.run();
              }}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
