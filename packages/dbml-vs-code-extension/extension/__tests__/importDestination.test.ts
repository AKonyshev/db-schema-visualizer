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

  test("writes nothing when the replacement is declined", async () => {
    jest
      .mocked(window.showOpenDialog)
      .mockResolvedValue([{ path: "/tmp/out" }] as never);
    jest.mocked(workspace.fs.stat).mockResolvedValue({} as never);
    jest.mocked(window.showWarningMessage).mockResolvedValue(undefined);

    expect(await resolveImportDestination(targets)).toBeUndefined();
  });
});
