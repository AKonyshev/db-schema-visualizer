/**
 * The open schemas, as plain data.
 *
 * Every function here is pure: nothing reads storage, nothing reads the clock,
 * nothing generates an identifier out of thin air. That is what lets the awkward
 * cases — closing the active tab, refusing to close the last one, restoring
 * rubbish from an old deployment — be tested as arithmetic rather than through a
 * browser.
 */
export interface SchemaTab {
  /**
   * Order of creation, and the thing that makes a tab's stored table layout its
   * own. It never changes and is never reused, so the layout a reader arranged
   * survives every other tab being closed around it.
   */
  number: number;
  /** What a file named it. Empty until a file does. */
  title: string;
  text: string;
  /**
   * Where in the bundled catalogue this tab came from, if it came from there at
   * all. It is what makes a second click on a file in the tree return to the
   * tab it is already open in rather than open a duplicate — the title cannot
   * do that job, because two folders may hold files of the same name.
   */
  sourcePath?: string;
}

export interface Workspace {
  tabs: SchemaTab[];
  activeNumber: number;
  /**
   * Carried rather than derived from the tabs, and serialised with them. A
   * counter rebuilt on load would hand a new tab the number of one already
   * closed, and with it that tab's abandoned table layout.
   */
  nextNumber: number;
}

// Bumped only when the stored shape changes in a way `parseWorkspace` cannot
// read. Storage outlives deployments, and a reader who left three schemas open
// should get an empty workspace rather than a broken page.
const STORAGE_VERSION = 1;

/** The key the diagram's per-document stores are filed under. */
export const documentKeyOf = (tab: SchemaTab): string => `tab-${tab.number}`;

export const activeTab = (workspace: Workspace): SchemaTab => {
  const found = workspace.tabs.find(
    (tab) => tab.number === workspace.activeNumber,
  );

  // Not reachable through any transition below — each one leaves the active
  // number pointing at a tab that exists — but the alternative to throwing is
  // returning `undefined` and making every caller handle a case that cannot
  // happen.
  if (found === undefined) {
    throw new Error(`No tab numbered ${workspace.activeNumber}`);
  }

  return found;
};

export const createWorkspace = (
  text: string,
  // Given on a first visit to an image that carries a catalogue, so the tab the
  // reader lands on is a real file of theirs rather than an untitled copy of
  // one.
  source?: { path: string; title: string },
): Workspace => ({
  tabs: [
    {
      number: 1,
      title: source?.title ?? "",
      text,
      ...(source === undefined ? {} : { sourcePath: source.path }),
    },
  ],
  activeNumber: 1,
  nextNumber: 2,
});

export const addTab = (workspace: Workspace, text: string): Workspace => ({
  tabs: [...workspace.tabs, { number: workspace.nextNumber, title: "", text }],
  // A tab nobody is looking at is not worth opening.
  activeNumber: workspace.nextNumber,
  nextNumber: workspace.nextNumber + 1,
});

export const tabForPath = (
  workspace: Workspace,
  path: string,
): SchemaTab | undefined =>
  workspace.tabs.find((tab) => tab.sourcePath === path);

/**
 * What choosing a file in the catalogue does.
 *
 * A file already open comes back as it is, text and all: the contents just
 * fetched are dropped rather than written over edits the reader made after
 * opening it. The caller normally avoids that fetch entirely by asking
 * `tabForPath` first — this branch is what catches the race, since the fetch is
 * asynchronous and the tab may have appeared while it was in flight.
 */
export const openCatalogFile = (
  workspace: Workspace,
  path: string,
  title: string,
  text: string,
): Workspace => {
  const existing = tabForPath(workspace, path);

  if (existing !== undefined) {
    return activateTab(workspace, existing.number);
  }

  return {
    tabs: [
      ...workspace.tabs,
      { number: workspace.nextNumber, title, text, sourcePath: path },
    ],
    activeNumber: workspace.nextNumber,
    nextNumber: workspace.nextNumber + 1,
  };
};

export const activateTab = (workspace: Workspace, number: number): Workspace =>
  workspace.tabs.some((tab) => tab.number === number)
    ? { ...workspace, activeNumber: number }
    : workspace;

/**
 * Closing the last tab does nothing: the site has no empty state to render, and
 * inventing one for a case the reader can always undo by opening a file is more
 * interface than the situation deserves.
 */
export const closeTab = (workspace: Workspace, number: number): Workspace => {
  if (workspace.tabs.length <= 1) {
    return workspace;
  }

  const index = workspace.tabs.findIndex((tab) => tab.number === number);
  if (index === -1) {
    return workspace;
  }

  const tabs = workspace.tabs.filter((tab) => tab.number !== number);

  // Closing a tab nobody was looking at must not move the reader.
  if (workspace.activeNumber !== number) {
    return { ...workspace, tabs };
  }

  // The tab that slid into the closed one's place, or the one before it when the
  // last tab was closed and nothing slid anywhere.
  const neighbour = tabs[Math.min(index, tabs.length - 1)];

  return { ...workspace, tabs, activeNumber: neighbour.number };
};

const mapActive = (
  workspace: Workspace,
  change: (tab: SchemaTab) => SchemaTab,
): Workspace => ({
  ...workspace,
  tabs: workspace.tabs.map((tab) =>
    tab.number === workspace.activeNumber ? change(tab) : tab,
  ),
});

export const updateActiveText = (
  workspace: Workspace,
  text: string,
): Workspace => mapActive(workspace, (tab) => ({ ...tab, text }));

/** What opening a file into the active tab does: new contents, new name. */
export const loadIntoActive = (
  workspace: Workspace,
  title: string,
  text: string,
): Workspace => mapActive(workspace, (tab) => ({ ...tab, title, text }));

export const serialiseWorkspace = (workspace: Workspace): string =>
  JSON.stringify({ version: STORAGE_VERSION, ...workspace });

const isTab = (value: unknown): value is SchemaTab => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const tab = value as Record<string, unknown>;

  return (
    typeof tab.number === "number" &&
    Number.isInteger(tab.number) &&
    typeof tab.title === "string" &&
    typeof tab.text === "string" &&
    // Absent for every tab written before the catalogue existed, and for every
    // tab opened by hand since. The stored version is not bumped for it:
    // refusing those tabs would throw away layouts over a field they had no way
    // to carry.
    (tab.sourcePath === undefined || typeof tab.sourcePath === "string")
  );
};

/**
 * Storage back into a workspace, or `null` when it cannot be trusted.
 *
 * Everything is checked rather than cast. The value comes from a browser that
 * may have been running a different version of this site last week, and a cast
 * would turn that into a blank page with a `TypeError` in a console nobody has
 * open.
 */
export const parseWorkspace = (raw: string | null): Workspace | null => {
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;

  if (candidate.version !== STORAGE_VERSION) {
    return null;
  }

  const { tabs, activeNumber, nextNumber } = candidate;

  if (!Array.isArray(tabs) || tabs.length === 0 || !tabs.every(isTab)) {
    return null;
  }

  if (typeof activeNumber !== "number" || typeof nextNumber !== "number") {
    return null;
  }

  // An active number naming no tab, or a counter that would hand a new tab a
  // number already in use, are both worse than starting over: the first renders
  // a workspace with nothing selected, the second silently gives one schema
  // another's saved layout.
  if (!tabs.some((tab) => tab.number === activeNumber)) {
    return null;
  }

  if (tabs.some((tab) => tab.number >= nextNumber)) {
    return null;
  }

  return { tabs, activeNumber, nextNumber };
};
