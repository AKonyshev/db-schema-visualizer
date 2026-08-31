import { DownloadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import ToolbarButton from "../Button";

import { type MessageKey } from "@/i18n/messages";
import { t } from "@/i18n/t";

const PANEL_ID = "toolbar-export-formats";

interface ExportMenuProps {
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
  onDownloadAdoc: () => void;
  onDownloadMarkdown: () => void;
}

const ExportMenu = ({
  onDownloadPng,
  onDownloadSvg,
  onDownloadAdoc,
  onDownloadMarkdown,
}: ExportMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Esc plus click-outside. ShortcutsLegend reaches the same outcome by a
  // different route — it is a modal with a full-screen backdrop that closes on
  // its own click — which does not fit a dropdown anchored to one button, so
  // this listens for an outside mousedown instead. Same behaviour for the user,
  // deliberately different mechanism.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        // Marks the key as spent, so nothing else takes an Escape that closed
        // this menu for an Escape nobody answered — the embedded frame reads
        // exactly this to decide whether the reader meant "put the page back".
        event.preventDefault();
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
    { labelKey: "action.exportMarkdown", run: onDownloadMarkdown },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <ToolbarButton
        label={t("action.export")}
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
      >
        <DownloadIcon />
      </ToolbarButton>

      {isOpen && (
        // Deliberately not role="menu"/"menuitem". Those roles promise the ARIA
        // menu pattern — arrow-key roving focus, Home/End, focus moved to the
        // first item on open and restored to the trigger on close — and none of
        // that is implemented. Announcing a menu and then not behaving like one
        // is worse for a screen-reader user than plain buttons, which Tab and
        // Enter already handle. This is a disclosure: aria-expanded on the
        // trigger, aria-controls pointing here.
        <div
          id={PANEL_ID}
          className="absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 overflow-hidden rounded-xl border border-subtle bg-surface-raised shadow-xl shadow-black/10"
        >
          {items.map((item) => (
            <button
              key={item.labelKey}
              className="block w-full whitespace-nowrap px-4 py-2 text-left text-xs text-content hover:bg-accent/10"
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
