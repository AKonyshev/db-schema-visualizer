import { t } from "json-table-schema-visualizer/src/i18n/t";

import { type SchemaTab, type Workspace } from "../workspace/workspace";

export interface TabBarProps {
  workspace: Workspace;
  onActivate: (number: number) => void;
  onClose: (number: number) => void;
  onAdd: () => void;
}

// A tab a file has not named still needs something on it, and the number is what
// distinguishes two untitled schemas from each other. It is the tab's own number
// rather than its position, so the label does not change when a tab to its left
// is closed.
const labelOf = (tab: SchemaTab): string =>
  tab.title === "" ? `${t("tab.untitled")} ${tab.number}` : tab.title;

const TabBar = ({
  workspace,
  onActivate,
  onClose,
  onAdd,
}: TabBarProps): JSX.Element => {
  // Closing the only tab does nothing, so it should not offer to.
  const closable = workspace.tabs.length > 1;

  return (
    <div
      role="tablist"
      className="flex shrink-0 items-center gap-px overflow-x-auto border-b border-neutral-700 bg-neutral-900"
    >
      {workspace.tabs.map((tab) => {
        const active = tab.number === workspace.activeNumber;

        return (
          <div
            key={tab.number}
            className={`flex shrink-0 items-center gap-1 border-r border-neutral-700 pr-1 ${
              active ? "bg-neutral-800" : "bg-neutral-900 hover:bg-neutral-800"
            }`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={active}
              title={labelOf(tab)}
              className={`max-w-40 truncate px-3 py-1 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 ${
                active ? "text-neutral-100" : "text-neutral-400"
              }`}
              onClick={() => {
                onActivate(tab.number);
              }}
            >
              {labelOf(tab)}
            </button>
            {closable && (
              <button
                type="button"
                title={t("tab.close")}
                aria-label={`${t("tab.close")}: ${labelOf(tab)}`}
                className="rounded px-1 text-neutral-500 hover:bg-neutral-700 hover:text-neutral-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                onClick={() => {
                  onClose(tab.number);
                }}
              >
                {/* A multiplication sign rather than the letter x: it is
                    centred and symmetric at any font size. */}
                &times;
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        title={t("tab.new")}
        aria-label={t("tab.new")}
        className="shrink-0 px-3 py-1 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
        onClick={onAdd}
      >
        +
      </button>
    </div>
  );
};

export default TabBar;
