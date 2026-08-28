import {
  addLocalFile,
  documentKeyOf,
  emptySession,
  isEdited,
  parseSession,
  removeLocalFile,
  revertCatalogFile,
  selectDocument,
  selectionAfterCatalogChange,
  serialiseSession,
  textOf,
  updateSelectedText,
  type Session,
} from "../session";

const withTwoLocals = (): Session =>
  addLocalFile(addLocalFile(emptySession(), "a.dbml", "A"), "b.dbml", "B");

describe("document keys", () => {
  test("a project file is keyed by its path, a local file by its id", () => {
    expect(documentKeyOf({ kind: "catalog", path: "billing/x.dbml" })).toBe(
      "catalog:billing/x.dbml",
    );
    expect(documentKeyOf({ kind: "local", id: 7 })).toBe("local:7");
  });
});

describe("local files", () => {
  test("opening one gives it an id and selects it", () => {
    const session = addLocalFile(emptySession(), "a.dbml", "A");

    expect(session.localFiles).toEqual([{ id: 1, name: "a.dbml", text: "A" }]);
    expect(session.selected).toEqual({ kind: "local", id: 1 });
    expect(session.nextLocalId).toBe(2);
  });

  test("ids are never reused, because a layout is filed under one", () => {
    const session = removeLocalFile(withTwoLocals(), 1);
    const next = addLocalFile(session, "c.dbml", "C");

    expect(next.localFiles.map((file) => file.id)).toEqual([2, 3]);
  });

  test("removing the selected file selects a neighbour", () => {
    const session = selectDocument(withTwoLocals(), { kind: "local", id: 1 });

    expect(removeLocalFile(session, 1).selected).toEqual({
      kind: "local",
      id: 2,
    });
  });

  test("removing another file leaves the reader where they were", () => {
    const session = selectDocument(withTwoLocals(), { kind: "local", id: 2 });

    expect(removeLocalFile(session, 1).selected).toEqual({
      kind: "local",
      id: 2,
    });
  });

  test("removing the last file selects nothing", () => {
    const session = addLocalFile(emptySession(), "a.dbml", "A");

    expect(removeLocalFile(session, 1).selected).toBeNull();
    expect(removeLocalFile(session, 1).localFiles).toEqual([]);
  });

  test("editing a local file rewrites the file itself", () => {
    const session = updateSelectedText(
      addLocalFile(emptySession(), "a.dbml", "A"),
      "edited",
    );

    expect(session.localFiles[0].text).toBe("edited");
    // A local file has no original to keep a version against.
    expect(session.edits).toEqual({});
  });
});

describe("project files", () => {
  const opened = (): Session =>
    selectDocument(emptySession(), { kind: "catalog", path: "x.dbml" });

  test("editing one keeps the reader's version beside the path", () => {
    const session = updateSelectedText(opened(), "mine");

    expect(session.edits).toEqual({ "x.dbml": "mine" });
    expect(isEdited(session, "x.dbml")).toBe(true);
    expect(isEdited(session, "other.dbml")).toBe(false);
  });

  test("the reader's version wins over what the server sent", () => {
    const session = updateSelectedText(opened(), "mine");
    const id = { kind: "catalog", path: "x.dbml" } as const;

    expect(textOf(session, id, "from the image")).toBe("mine");
    expect(textOf(emptySession(), id, "from the image")).toBe("from the image");
  });

  test("reverting drops the version and goes back to the image", () => {
    const session = revertCatalogFile(
      updateSelectedText(opened(), "mine"),
      "x.dbml",
    );

    expect(isEdited(session, "x.dbml")).toBe(false);
    expect(
      textOf(session, { kind: "catalog", path: "x.dbml" }, "from the image"),
    ).toBe("from the image");
  });

  test("a local file's text comes from the file, whatever the caller loaded", () => {
    const session = addLocalFile(emptySession(), "a.dbml", "A");

    expect(textOf(session, { kind: "local", id: 1 }, "ignored")).toBe("A");
    expect(textOf(session, { kind: "local", id: 99 }, "ignored")).toBeNull();
  });
});

describe("what to select once the catalogue is known", () => {
  test("a selection the catalogue still has is left alone", () => {
    const session = selectDocument(emptySession(), {
      kind: "catalog",
      path: "b.dbml",
    });

    expect(
      selectionAfterCatalogChange(session, ["a.dbml", "b.dbml"]).selected,
    ).toEqual({ kind: "catalog", path: "b.dbml" });
  });

  test("a selection the catalogue lost falls back to its first file", () => {
    const session = selectDocument(emptySession(), {
      kind: "catalog",
      path: "gone.dbml",
    });

    expect(selectionAfterCatalogChange(session, ["a.dbml"]).selected).toEqual({
      kind: "catalog",
      path: "a.dbml",
    });
  });

  test("with no catalogue at all it falls back to the reader's own files", () => {
    const session = selectDocument(withTwoLocals(), {
      kind: "catalog",
      path: "gone.dbml",
    });

    expect(selectionAfterCatalogChange(session, []).selected).toEqual({
      kind: "local",
      id: 1,
    });
  });

  test("with nothing anywhere it selects nothing", () => {
    expect(selectionAfterCatalogChange(emptySession(), []).selected).toBeNull();
  });

  test("a local selection that was deleted elsewhere is repaired too", () => {
    const session: Session = {
      ...emptySession(),
      selected: { kind: "local", id: 4 },
    };

    expect(selectionAfterCatalogChange(session, ["a.dbml"]).selected).toEqual({
      kind: "catalog",
      path: "a.dbml",
    });
  });
});

describe("storage", () => {
  test("a session survives the round trip", () => {
    const session = updateSelectedText(
      selectDocument(withTwoLocals(), { kind: "catalog", path: "x.dbml" }),
      "mine",
    );

    expect(parseSession(serialiseSession(session))).toEqual(session);
  });

  test("nothing stored is not an error", () => {
    expect(parseSession(null)).toBeNull();
  });

  test("the tabs of the previous model are refused outright", () => {
    // Version 1 held tabs numbered from 1 and filed layouts under those
    // numbers. Read as a session it would hand documents each other's
    // arrangements, so it is refused and the layouts go with it.
    const version1 = JSON.stringify({
      version: 1,
      tabs: [{ number: 1, title: "", text: "old" }],
      activeNumber: 1,
      nextNumber: 2,
    });

    expect(parseSession(version1)).toBeNull();
  });

  test("rubbish is refused", () => {
    expect(parseSession("not json")).toBeNull();
    expect(parseSession(JSON.stringify({ version: 2 }))).toBeNull();
    expect(
      parseSession(
        JSON.stringify({
          version: 2,
          localFiles: [{ id: "one", name: "a", text: "b" }],
          nextLocalId: 2,
          edits: {},
          selected: null,
        }),
      ),
    ).toBeNull();
    expect(
      parseSession(
        JSON.stringify({
          version: 2,
          localFiles: [],
          nextLocalId: 1,
          edits: { "x.dbml": 7 },
          selected: null,
        }),
      ),
    ).toBeNull();
  });

  test("an id that is not a whole number is refused", () => {
    // Ids are handed out by a counter and used to build a storage key. One that
    // arrived as 1.5 came from something other than this code.
    expect(
      parseSession(
        JSON.stringify({
          version: 2,
          localFiles: [{ id: 1.5, name: "a", text: "b" }],
          nextLocalId: 3,
          edits: {},
          selected: null,
        }),
      ),
    ).toBeNull();
  });

  test("a counter that would reissue an id in use is refused", () => {
    expect(
      parseSession(
        JSON.stringify({
          version: 2,
          localFiles: [{ id: 3, name: "a", text: "b" }],
          nextLocalId: 3,
          edits: {},
          selected: null,
        }),
      ),
    ).toBeNull();
  });

  test("a selection naming no local file is refused", () => {
    expect(
      parseSession(
        JSON.stringify({
          version: 2,
          localFiles: [],
          nextLocalId: 1,
          edits: {},
          selected: { kind: "local", id: 1 },
        }),
      ),
    ).toBeNull();
  });

  test("a selection naming a path is kept, because the catalogue decides later", () => {
    const stored = JSON.stringify({
      version: 2,
      localFiles: [],
      nextLocalId: 1,
      edits: {},
      selected: { kind: "catalog", path: "anything.dbml" },
    });

    expect(parseSession(stored)?.selected).toEqual({
      kind: "catalog",
      path: "anything.dbml",
    });
  });
});
