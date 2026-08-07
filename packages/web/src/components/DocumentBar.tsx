import { useRef } from "react";
import { t } from "json-table-schema-visualizer/src/i18n/t";

import { DBML_EXTENSION } from "../document/dbmlFilename";

export interface DocumentBarProps {
  onOpen: (file: File) => void;
  onDownload: () => void;
}

const BUTTON_CLASS =
  "rounded px-3 py-1 text-sm text-neutral-200 hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400";

// The site's only chrome that is not the visualizer's own toolbar. It sits above
// the editor rather than beside the diagram because what it acts on is the text:
// the diagram is a view of the document, the document is what gets saved.
const DocumentBar = ({ onOpen, onDownload }: DocumentBarProps): JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-neutral-700 bg-neutral-800 px-2 py-1">
      <input
        ref={inputRef}
        type="file"
        // A filter, not a gate — every desktop picker lets the reader switch to
        // "all files". It exists so the common case shows the right files first.
        accept={DBML_EXTENSION}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file !== undefined) {
            onOpen(file);
          }
          // Cleared so that choosing the same file twice fires `change` again.
          // Without this, opening a file, editing it, and opening it once more
          // to discard the edits does nothing the second time.
          event.target.value = "";
        }}
      />
      <button
        type="button"
        title={t("action.openFile.hint")}
        className={BUTTON_CLASS}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        {t("action.openFile")}
      </button>
      <button
        type="button"
        title={t("action.downloadFile.hint")}
        className={BUTTON_CLASS}
        onClick={onDownload}
      >
        {t("action.downloadFile")}
      </button>
    </div>
  );
};

export default DocumentBar;
