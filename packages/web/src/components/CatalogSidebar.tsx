import { useMemo, useState } from "react";
import { t } from "json-table-schema-visualizer/src/i18n/t";

import { type CatalogFile } from "../catalog/catalogManifest";
import {
  buildTree,
  filterTree,
  type CatalogNode,
} from "../catalog/catalogTree";

export interface CatalogSidebarProps {
  files: CatalogFile[];
  /** The catalogue path the active tab came from, if it came from one. */
  activePath: string | null;
  /** The last file that would not open, so the tree can say which one. */
  failedPath: string | null;
  onOpen: (file: CatalogFile) => void;
}

const ROW_CLASS =
  "flex w-full items-center gap-1 truncate rounded py-1 pr-2 text-left text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400";

interface NodesProps {
  nodes: CatalogNode[];
  depth: number;
  collapsed: Set<string>;
  activePath: string | null;
  failedPath: string | null;
  onToggle: (path: string) => void;
  onOpen: (file: CatalogFile) => void;
}

// Recursive rather than flattened, because the nesting is the tree: a flat list
// carrying a depth would have to rebuild the parent-child relation to answer
// either question the reader asks of it — how deep is this, and what does
// collapsing that hide.
const Nodes = ({
  nodes,
  depth,
  collapsed,
  activePath,
  failedPath,
  onToggle,
  onOpen,
}: NodesProps): JSX.Element => (
  <ul className="list-none">
    {nodes.map((node) => {
      const indent = { paddingLeft: `${depth * 12 + 8}px` };

      if (node.kind === "folder") {
        const open = !collapsed.has(node.path);

        return (
          <li key={`folder:${node.path}`}>
            <button
              type="button"
              aria-expanded={open}
              style={indent}
              className={`${ROW_CLASS} text-neutral-300 hover:bg-neutral-700`}
              onClick={() => {
                onToggle(node.path);
              }}
            >
              {/* Triangles rather than chevron glyphs: they are in every font
                  the site can end up being rendered with. */}
              <span className="shrink-0 text-neutral-500">
                {open ? "▾" : "▸"}
              </span>
              <span className="truncate">{node.name}</span>
            </button>
            {open && (
              <Nodes
                nodes={node.children}
                depth={depth + 1}
                collapsed={collapsed}
                activePath={activePath}
                failedPath={failedPath}
                onToggle={onToggle}
                onOpen={onOpen}
              />
            )}
          </li>
        );
      }

      const active = node.file.path === activePath;
      const failed = node.file.path === failedPath;

      return (
        <li key={`file:${node.file.path}`}>
          <button
            type="button"
            aria-current={active}
            // The path rather than the title: the title is already the row, and
            // the path is the thing the row does not say.
            title={node.file.path}
            style={indent}
            className={`${ROW_CLASS} ${
              active
                ? "bg-neutral-700 text-neutral-100"
                : "text-neutral-300 hover:bg-neutral-700"
            }`}
            onClick={() => {
              onOpen(node.file);
            }}
          >
            <span className="truncate">{node.file.title}</span>
            {failed && (
              <span className="shrink-0 text-xs text-red-400">
                {t("catalog.openFailed")}
              </span>
            )}
          </button>
        </li>
      );
    })}
  </ul>
);

/**
 * The schemas the image was built with, as a tree.
 *
 * Rendered only when there are any — an image without a catalogue is the site
 * as it was before this existed, and a column explaining that it is empty would
 * be worse than no column at all. `App` decides that; this component assumes it
 * has files to show.
 */
const CatalogSidebar = ({
  files,
  activePath,
  failedPath,
  onOpen,
}: CatalogSidebarProps): JSX.Element => {
  const [query, setQuery] = useState("");
  // Collapsed folders rather than expanded ones, so a catalogue opens showing
  // everything: someone who has just deployed this has no idea what is in it.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState(false);

  const tree = useMemo(() => buildTree(files), [files]);
  const shown = useMemo(() => filterTree(tree, query), [tree, query]);

  if (hidden) {
    return (
      <div className="flex h-full w-8 shrink-0 justify-center border-r border-neutral-700 bg-neutral-900 py-1">
        <button
          type="button"
          title={t("catalog.show")}
          aria-label={t("catalog.show")}
          className="h-6 rounded px-1 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
          onClick={() => {
            setHidden(false);
          }}
        >
          ▸
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-neutral-700 bg-neutral-900">
      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-neutral-700 px-2 py-1">
        <span className="truncate text-xs uppercase tracking-wide text-neutral-500">
          {t("catalog.title")}
        </span>
        <button
          type="button"
          title={t("catalog.hide")}
          aria-label={t("catalog.hide")}
          className="rounded px-1 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
          onClick={() => {
            setHidden(true);
          }}
        >
          ◂
        </button>
      </div>
      <div className="shrink-0 px-2 py-1">
        <input
          type="search"
          value={query}
          placeholder={t("catalog.filter")}
          aria-label={t("catalog.filter")}
          className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />
      </div>
      {/* `min-h-0` so the tree scrolls inside the column rather than pushing the
          filter off the top. */}
      <div className="min-h-0 flex-1 overflow-auto pb-2">
        <Nodes
          nodes={shown}
          depth={0}
          collapsed={collapsed}
          activePath={activePath}
          failedPath={failedPath}
          onToggle={(path) => {
            setCollapsed((current) => {
              const next = new Set(current);

              if (next.has(path)) {
                next.delete(path);
              } else {
                next.add(path);
              }

              return next;
            });
          }}
          onOpen={onOpen}
        />
      </div>
    </div>
  );
};

export default CatalogSidebar;
