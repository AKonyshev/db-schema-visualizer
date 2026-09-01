import { window, workspace } from "vscode";

import { importFileName, resolveImportDestination } from "../importDestination";

// `workspaceFolders` is readonly in the real API; the mock is a plain object,
// and the tests need it empty so no default folder is offered.
type WorkspaceMock = { workspaceFolders: Array<{ uri: unknown }> | undefined };
const workspaceMock = workspace as unknown as WorkspaceMock;

const targets = [
  { databaseName: "billing", schemaNames: ["public"] },
  { databaseName: "orders", schemaNames: ["audit", "public"] },
];

describe("importFileName", () => {
  test("names a lone file after its schema", () => {
    expect(importFileName(targets[0], true)).toBe("public.dbml");
  });

  test("names it after the database when there are several schemas", () => {
    expect(importFileName(targets[1], true)).toBe("orders.dbml");
  });

  test("always names after the database when there are several files", () => {
    // Two databases with one `public` each would otherwise collide.
    expect(importFileName(targets[0], false)).toBe("billing.dbml");
  });

  test("keeps a name that walks up out of the file name", () => {
    // PostgreSQL quotes any identifier, `../secrets` included, and joining that
    // to the chosen folder resolves the `..` and writes a level above it.
    expect(
      importFileName(
        { databaseName: "../../etc/passwd", schemaNames: ["public"] },
        false,
      ),
    ).toBe("_.._etc_passwd.dbml");
  });

  test("sanitizes a schema name too", () => {
    // The lone-schema name comes from the server just as the database name does.
    expect(
      importFileName({ databaseName: "orders", schemaNames: ["../x"] }, true),
    ).toBe("_x.dbml");
  });

  test("keeps letters the user can read", () => {
    // Only what a filesystem refuses is replaced. A name outside ASCII is a
    // perfectly good file name, and mangling it to underscores would be worse
    // than the problem being fixed.
    expect(
      importFileName(
        { databaseName: "pedidos_españa", schemaNames: ["public"] },
        false,
      ),
    ).toBe("pedidos_españa.dbml");
  });

  test("falls back when nothing usable is left", () => {
    expect(
      importFileName({ databaseName: "..", schemaNames: ["public"] }, false),
    ).toBe("database.dbml");
  });

  test("refuses a name Windows reserves for a device", () => {
    expect(
      importFileName({ databaseName: "con", schemaNames: ["public"] }, false),
    ).toBe("con_.dbml");
  });
});

describe("resolveImportDestination", () => {
  beforeEach(() => {
    jest.mocked(window.showSaveDialog).mockReset();
    jest.mocked(window.showOpenDialog).mockReset();
    jest.mocked(window.showWarningMessage).mockReset();
    jest.mocked(workspace.fs.stat).mockReset();
    workspaceMock.workspaceFolders = undefined;
  });

  test("asks for a file when there is one database", async () => {
    jest
      .mocked(window.showSaveDialog)
      .mockResolvedValue({ path: "/tmp/public.dbml" } as never);

    const destination = await resolveImportDestination([targets[0]]);

    expect(destination?.get("billing")).toEqual({ path: "/tmp/public.dbml" });
  });

  test("returns undefined when the save dialog is dismissed", async () => {
    jest.mocked(window.showSaveDialog).mockResolvedValue(undefined);

    expect(await resolveImportDestination([targets[0]])).toBeUndefined();
  });

  test("asks for a folder when there are several, and names files by database", async () => {
    jest
      .mocked(window.showOpenDialog)
      .mockResolvedValue([{ path: "/tmp/out" }] as never);
    jest.mocked(workspace.fs.stat).mockRejectedValue(new Error("not found"));

    const destination = await resolveImportDestination(targets);

    expect(destination?.get("billing")?.path).toBe("/tmp/out/billing.dbml");
    expect(destination?.get("orders")?.path).toBe("/tmp/out/orders.dbml");
    expect(window.showWarningMessage).not.toHaveBeenCalled();
  });

  test("confirms once before replacing files that are already there", async () => {
    jest
      .mocked(window.showOpenDialog)
      .mockResolvedValue([{ path: "/tmp/out" }] as never);
    jest
      .mocked(workspace.fs.stat)
      .mockResolvedValueOnce({} as never)
      .mockRejectedValueOnce(new Error("not found"));
    jest
      .mocked(window.showWarningMessage)
      .mockResolvedValue("Overwrite" as never);

    const destination = await resolveImportDestination(targets);

    expect(window.showWarningMessage).toHaveBeenCalledWith(
      "These files already exist and will be replaced: billing.dbml",
      { modal: true },
      "Overwrite",
    );
    expect(destination?.size).toBe(2);
  });

  test("writes every file inside the folder that was chosen", async () => {
    jest
      .mocked(window.showOpenDialog)
      .mockResolvedValue([{ path: "/tmp/out" }] as never);
    jest.mocked(workspace.fs.stat).mockRejectedValue(new Error("not found"));

    const destination = await resolveImportDestination([
      { databaseName: "../../etc/passwd", schemaNames: ["public"] },
      targets[1],
    ]);

    expect(destination?.get("../../etc/passwd")?.path).toBe(
      "/tmp/out/_.._etc_passwd.dbml",
    );
    expect(destination?.get("orders")?.path).toBe("/tmp/out/orders.dbml");
  });

  test("gives two databases that sanitize alike separate files", async () => {
    jest
      .mocked(window.showOpenDialog)
      .mockResolvedValue([{ path: "/tmp/out" }] as never);
    jest.mocked(workspace.fs.stat).mockRejectedValue(new Error("not found"));

    const destination = await resolveImportDestination([
      { databaseName: "a/b", schemaNames: ["public"] },
      { databaseName: "a_b", schemaNames: ["public"] },
      // Two names a case-insensitive filesystem cannot tell apart.
      { databaseName: "Orders", schemaNames: ["public"] },
      { databaseName: "orders", schemaNames: ["public"] },
    ]);

    expect(destination?.get("a/b")?.path).toBe("/tmp/out/a_b.dbml");
    expect(destination?.get("a_b")?.path).toBe("/tmp/out/a_b-2.dbml");
    expect(destination?.get("Orders")?.path).toBe("/tmp/out/Orders.dbml");
    expect(destination?.get("orders")?.path).toBe("/tmp/out/orders-2.dbml");
  });

  test("names the file it warns about, not the database", async () => {
    jest
      .mocked(window.showOpenDialog)
      .mockResolvedValue([{ path: "/tmp/out" }] as never);
    jest.mocked(workspace.fs.stat).mockResolvedValue({} as never);
    jest
      .mocked(window.showWarningMessage)
      .mockResolvedValue("Overwrite" as never);

    await resolveImportDestination([
      { databaseName: "a/b", schemaNames: ["public"] },
      { databaseName: "a_b", schemaNames: ["public"] },
    ]);

    expect(window.showWarningMessage).toHaveBeenCalledWith(
      "These files already exist and will be replaced: a_b.dbml, a_b-2.dbml",
      { modal: true },
      "Overwrite",
    );
  });

  test("writes nothing when the replacement is declined", async () => {
    jest
      .mocked(window.showOpenDialog)
      .mockResolvedValue([{ path: "/tmp/out" }] as never);
    jest.mocked(workspace.fs.stat).mockResolvedValue({} as never);
    jest.mocked(window.showWarningMessage).mockResolvedValue(undefined);

    expect(await resolveImportDestination(targets)).toBeUndefined();
  });
});
