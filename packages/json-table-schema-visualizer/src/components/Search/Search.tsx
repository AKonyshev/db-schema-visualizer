import {
  useState,
  useMemo,
  useRef,
  useEffect,
  type KeyboardEvent,
} from "react";
import { type JSONTableTable } from "shared/types/tableSchema";

import { t } from "@/i18n/t";
import eventEmitter from "@/events-emitter";
import {
  setHighlightedColumns,
  setHoveredTableName,
} from "@/stores/hoverStore";
import { isTypingTarget, type TypingTarget } from "@/utils/isTypingTarget";

interface SearchResult {
  type: "table" | "column";
  tableName: string;
  name: string;
}

interface SearchProps {
  tables: JSONTableTable[];
}

/**
 * This is the search bar component placed on the top-right corner
 * of the stage, where you can search table or column.
 */
const Search = ({ tables }: SearchProps) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(() => {
    if (search.length < 2) return [];

    const results: SearchResult[] = [];
    const searchLower = search.toLowerCase();

    tables.forEach((table) => {
      // Search in table names
      if (table.name.toLowerCase().includes(searchLower)) {
        results.push({
          type: "table",
          tableName: table.name,
          name: table.name,
        });
      }

      // Search in column names
      table.fields.forEach((field) => {
        if (field.name.toLowerCase().includes(searchLower)) {
          results.push({
            type: "column",
            tableName: table.name,
            name: field.name,
          });
        }
      });
    });

    const collator = new Intl.Collator(undefined, {
      sensitivity: "base",
      numeric: true,
    });

    const isExact = (r: SearchResult) =>
      r.name.toLowerCase() === search.toLowerCase();

    const resultsSorted = results.sort((a, b) => {
      // 0) exact name match goes to the very top (table or column)
      const aExact = isExact(a);
      const bExact = isExact(b);
      if (aExact !== bExact) return aExact ? -1 : 1;

      // 1) put tables before columns
      if (a.type !== b.type) return a.type === "table" ? -1 : 1;

      // 2) within tables: sort by table name (same as `name`)
      if (a.type === "table") {
        return collator.compare(a.name, b.name);
      }

      // 3) within columns: sort by column name, then by table name
      const byColName = collator.compare(a.name, b.name);
      if (byColName !== 0) return byColName;

      return collator.compare(a.tableName, b.tableName);
    });

    return resultsSorted;
  }, [tables, search]);

  const handleSelect = (result: SearchResult) => {
    setHoveredTableName(null);
    if (result.type === "column") {
      setHighlightedColumns([`${result.tableName}.${result.name}`]);
    } else {
      setHighlightedColumns([]);
    }
    // Center the diagram on the selected table and ask the table to highlight itself
    eventEmitter.emit("table:center", { tableName: result.tableName });
    eventEmitter.emit(`highlight:table:${result.tableName}`);

    setIsOpen(false);
    setSearch("");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current != null &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleShortcut = (e: globalThis.KeyboardEvent) => {
      if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f")) {
        return;
      }

      // Ctrl/Cmd+F belongs to whatever holds focus. The listener is on the
      // window, so without this the preventDefault below would deny a focused
      // text field its own find — including a code editor sharing the page.
      if (isTypingTarget(e.target as TypingTarget | null)) {
        return;
      }

      e.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  const handleOnEnterClick = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (searchResults.length > 0) {
        handleSelect(searchResults[0]);
        setIsOpen(false);
      }
    }
    if (e.key === "ArrowDown") {
      const firstButton = dropdownRef.current?.querySelector("button");
      firstButton?.focus();
    }
  };

  const handleOptionClick = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      (e.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  return (
    // `absolute`, not `fixed`: pinned to the diagram's own box so it stays over
    // the diagram when that is one pane of a page rather than the whole window.
    <div className="absolute top-4 right-4 z-50" ref={dropdownRef}>
      <div className="relative">
        <div title={t("search.tooltip")} className="relative flex items-center">
          <input
            type="text"
            value={search}
            onKeyDown={handleOnEnterClick}
            ref={inputRef}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            placeholder={t("search.placeholder")}
            className="w-72 rounded-xl border border-subtle bg-surface-raised px-4 py-3 text-sm text-content shadow-lg shadow-black/5 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />

          <span className="absolute right-2 rounded-lg bg-surface-sunken px-2 py-1 text-content-muted">
            ⌘F
          </span>
        </div>

        {isOpen && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-subtle bg-surface-raised shadow-xl shadow-black/10">
            {searchResults.map((result, index) => (
              <button
                tabIndex={-index}
                key={`${result.type}-${result.tableName}-${result.name}-${index}`}
                onClick={() => {
                  handleSelect(result);
                }}
                onKeyDown={handleOptionClick}
                className="flex w-full flex-col items-start px-4 py-2 text-left text-sm hover:bg-accent/10 focus:bg-accent/10 focus:outline-none"
              >
                <div className="flex space-x-2 w-full items-start">
                  <span className="text-xs mt-[3px]">
                    {result.type === "table" ? "📋" : "🔤"}
                  </span>
                  <span className="break-all font-medium text-content">
                    {result.name}
                  </span>
                </div>
                {result.type === "column" && (
                  <div className="mt-1 break-all text-xs text-content-muted">
                    in {result.tableName}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
