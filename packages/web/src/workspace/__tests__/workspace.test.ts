import {
  activateTab,
  activeTab,
  addTab,
  closeTab,
  createWorkspace,
  documentKeyOf,
  loadIntoActive,
  openCatalogFile,
  parseWorkspace,
  serialiseWorkspace,
  tabForPath,
  updateActiveText,
  type Workspace,
} from "../workspace";

const threeTabs = (): Workspace =>
  addTab(addTab(createWorkspace("first"), "second"), "third");

describe("a workspace of open schemas", () => {
  test("starts with one tab, active, holding the text it was given", () => {
    const workspace = createWorkspace("Table t {}");

    expect(workspace.tabs).toHaveLength(1);
    expect(activeTab(workspace).text).toBe("Table t {}");
  });

  test("activates each tab as it is added", () => {
    const workspace = threeTabs();

    expect(workspace.tabs).toHaveLength(3);
    expect(activeTab(workspace).text).toBe("third");
  });

  // The whole mechanism of per-tab layouts: the diagram files table positions
  // under this key, so two tabs sharing one would share an arrangement.
  test("gives every tab a document key of its own", () => {
    const keys = threeTabs().tabs.map(documentKeyOf);

    expect(new Set(keys).size).toBe(keys.length);
  });

  // Reusing a number would hand a new tab the abandoned layout of a closed one.
  test("never reuses the number of a closed tab", () => {
    const opened = threeTabs();
    const afterClosing = closeTab(opened, 2);
    const reopened = addTab(afterClosing, "fourth");

    const numbers = opened.tabs.map((tab) => tab.number);
    expect(numbers).toContain(2);
    expect(activeTab(reopened).number).not.toBe(2);
    expect(new Set(reopened.tabs.map((tab) => tab.number)).size).toBe(
      reopened.tabs.length,
    );
  });

  test("switching tabs finds the other schema's text", () => {
    const workspace = activateTab(threeTabs(), 1);

    expect(activeTab(workspace).text).toBe("first");
  });

  test("ignores a request to activate a tab that is not open", () => {
    const workspace = threeTabs();

    expect(activateTab(workspace, 99)).toEqual(workspace);
  });

  test("editing one tab leaves every other tab's text untouched", () => {
    const edited = updateActiveText(activateTab(threeTabs(), 2), "rewritten");

    expect(activeTab(edited).text).toBe("rewritten");
    expect(edited.tabs.map((tab) => tab.text)).toEqual([
      "first",
      "rewritten",
      "third",
    ]);
  });

  test("opening a file into the active tab names it and replaces its text", () => {
    const loaded = loadIntoActive(threeTabs(), "orders.dbml", "Table o {}");

    expect(activeTab(loaded).title).toBe("orders.dbml");
    expect(activeTab(loaded).text).toBe("Table o {}");
    expect(loaded.tabs[0].title).toBe("");
  });

  describe("closing a tab", () => {
    test("activates the tab that slid into its place", () => {
      const workspace = activateTab(threeTabs(), 2);

      expect(activeTab(closeTab(workspace, 2)).text).toBe("third");
    });

    test("activates the one before it when the last tab is closed", () => {
      const workspace = threeTabs();

      expect(activeTab(closeTab(workspace, 3)).text).toBe("second");
    });

    test("does not move the reader when the closed tab was not active", () => {
      const workspace = activateTab(threeTabs(), 3);

      expect(activeTab(closeTab(workspace, 1)).number).toBe(3);
    });

    // There is no empty state to render, so there is nothing to close into.
    test("refuses to close the only tab", () => {
      const workspace = createWorkspace("only");

      expect(closeTab(workspace, 1)).toEqual(workspace);
    });

    test("ignores a tab that is not open", () => {
      const workspace = threeTabs();

      expect(closeTab(workspace, 99)).toEqual(workspace);
    });

    test("always leaves the active number pointing at a tab that exists", () => {
      let workspace = threeTabs();

      for (const number of [1, 2, 3]) {
        workspace = closeTab(workspace, number);
        expect(() => activeTab(workspace)).not.toThrow();
      }
    });
  });

  describe("surviving a reload", () => {
    test("round-trips through storage unchanged", () => {
      const workspace = loadIntoActive(
        activateTab(threeTabs(), 2),
        "orders.dbml",
        "Table o {}",
      );

      expect(parseWorkspace(serialiseWorkspace(workspace))).toEqual(workspace);
    });

    test.each([
      ["nothing stored at all", null],
      ["not JSON", "{not json"],
      ["JSON that is not an object", "42"],
      ["null", "null"],
      ["an object with no version", '{"tabs":[],"activeNumber":1}'],
      [
        "a version this build cannot read",
        '{"version":99,"tabs":[{"number":1,"title":"","text":""}],"activeNumber":1,"nextNumber":2}',
      ],
      ["no tabs", '{"version":1,"tabs":[],"activeNumber":1,"nextNumber":2}'],
      [
        "a tab missing its text",
        '{"version":1,"tabs":[{"number":1,"title":""}],"activeNumber":1,"nextNumber":2}',
      ],
      [
        "a tab numbered with a string",
        '{"version":1,"tabs":[{"number":"1","title":"","text":""}],"activeNumber":1,"nextNumber":2}',
      ],
      [
        "an active number naming no tab",
        '{"version":1,"tabs":[{"number":1,"title":"","text":""}],"activeNumber":7,"nextNumber":2}',
      ],
      [
        "a counter that would reissue a number already in use",
        '{"version":1,"tabs":[{"number":5,"title":"","text":""}],"activeNumber":5,"nextNumber":2}',
      ],
    ])("refuses %s", (_description, raw) => {
      expect(parseWorkspace(raw)).toBeNull();
    });

    // The point of every case above: the caller can always fall back, so a
    // reader whose storage was written by last month's deployment gets a working
    // page rather than a blank one.
    test("a refusal leaves the caller able to start fresh", () => {
      const restored = parseWorkspace("{corrupt") ?? createWorkspace("fresh");

      expect(restored.tabs).toHaveLength(1);
      expect(activeTab(restored).text).toBe("fresh");
    });
  });
});

describe("tabs opened from the bundled catalogue", () => {
  test("a catalogue file opens in a tab of its own", () => {
    const before = createWorkspace("Table a {\n  id integer\n}\n");
    const after = openCatalogFile(
      before,
      { path: "billing/invoices.dbml", title: "invoices.dbml" },
      "Table invoices {\n  id integer\n}\n",
    );

    expect(after.tabs).toHaveLength(2);
    expect(activeTab(after)).toMatchObject({
      title: "invoices.dbml",
      sourcePath: "billing/invoices.dbml",
      text: "Table invoices {\n  id integer\n}\n",
    });
  });

  test("choosing a file already open returns to it, keeping its text", () => {
    const opened = openCatalogFile(
      createWorkspace("first"),
      { path: "users.dbml", title: "users.dbml" },
      "original",
    );
    const edited = updateActiveText(opened, "edited by the reader");
    const elsewhere = activateTab(edited, 1);

    const again = openCatalogFile(
      elsewhere,
      { path: "users.dbml", title: "users.dbml" },
      "original",
    );

    // Two clicks on one file must not cost the reader the edits made between
    // them, and must not leave two tabs on the same file.
    expect(again.tabs).toHaveLength(2);
    expect(activeTab(again).text).toBe("edited by the reader");
  });

  test("the tab a path is open in can be found", () => {
    const opened = openCatalogFile(
      createWorkspace("first"),
      { path: "users.dbml", title: "users.dbml" },
      "text",
    );

    expect(tabForPath(opened, "users.dbml")?.number).toBe(2);
    expect(tabForPath(opened, "nothing.dbml")).toBeUndefined();
  });

  test("a first visit can start from a catalogue file", () => {
    const workspace = createWorkspace("text", {
      path: "billing/invoices.dbml",
      title: "invoices.dbml",
    });

    expect(workspace.tabs).toEqual([
      {
        number: 1,
        title: "invoices.dbml",
        text: "text",
        sourcePath: "billing/invoices.dbml",
      },
    ]);
  });

  test("the path survives storage, and tabs written without one still read", () => {
    const opened = openCatalogFile(
      createWorkspace("first"),
      { path: "users.dbml", title: "users.dbml" },
      "text",
    );

    expect(parseWorkspace(serialiseWorkspace(opened))).toEqual(opened);

    // Written by a deployment from before the catalogue existed. The version is
    // unchanged, so these must still restore rather than be thrown away.
    const older = JSON.stringify({
      version: 1,
      tabs: [{ number: 1, title: "", text: "old" }],
      activeNumber: 1,
      nextNumber: 2,
    });

    expect(parseWorkspace(older)?.tabs[0].sourcePath).toBeUndefined();
  });

  test("a stored tab whose path is not a string is refused", () => {
    const broken = JSON.stringify({
      version: 1,
      tabs: [{ number: 1, title: "", text: "t", sourcePath: 7 }],
      activeNumber: 1,
      nextNumber: 2,
    });

    expect(parseWorkspace(broken)).toBeNull();
  });
});
