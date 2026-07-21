jest.mock("db-to-dbml", () => {
  const actual = jest.requireActual(
    "db-to-dbml",
  ) as typeof import("db-to-dbml");
  return {
    ...actual,
    fetchPostgresSchema: jest.fn(),
    listSchemaNames: jest.fn(),
    schemaToDbml: jest.fn(),
  };
});

import { commands, window, workspace } from "vscode";
import {
  DbImportError,
  DbImportErrorCode,
  fetchPostgresSchema,
  listSchemaNames,
  schemaToDbml,
} from "db-to-dbml";

import type { SecretStore } from "../connectionStore";
import { importFromDatabase } from "../importFromDatabase";

function fakeContext() {
  return { secrets: {} } as Parameters<typeof importFromDatabase>[0];
}

function fakeSecretsContext() {
  const map = new Map<string, string>();
  const secrets: SecretStore = {
    get: async (k) => map.get(k),
    store: async (k, v) => void map.set(k, v),
  };
  return {
    map,
    context: { secrets } as Parameters<typeof importFromDatabase>[0],
  };
}

describe("importFromDatabase", () => {
  // These tests drive failure paths on purpose, and the production code logs
  // the cause to the Extension Host log. Silencing it here keeps the suite's
  // output pristine — a wall of expected stack traces makes a passing run look
  // broken. Scoped to this suite, so an unexpected error elsewhere still shows.
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.mocked(console.error).mockRestore();
  });

  beforeEach(() => {
    jest.mocked(fetchPostgresSchema).mockReset();
    jest.mocked(listSchemaNames).mockReset();
    jest.mocked(schemaToDbml).mockReset();
    jest.mocked(window.showErrorMessage).mockReset();
    jest.mocked(window.showSaveDialog).mockReset();
    jest.mocked(window.showTextDocument).mockReset();
    jest.mocked(workspace.fs.writeFile).mockReset();
    jest.mocked(commands.executeCommand).mockReset();
    jest.mocked(window.showInformationMessage).mockReset();
    jest.mocked(window.showQuickPick).mockReset();
    jest.mocked(window.showInputBox).mockReset();
  });

  test("reports a database import error when fetching the schema fails", async () => {
    jest
      .mocked(fetchPostgresSchema)
      .mockRejectedValue(
        new DbImportError(DbImportErrorCode.AUTH_FAILED, "auth"),
      );

    await importFromDatabase(fakeContext(), "postgres://u:p@h/db");

    expect(window.showErrorMessage).toHaveBeenCalledWith(
      "Authentication failed. Check the username and password.",
    );
  });

  test("reports a post-save error when opening the imported file fails", async () => {
    jest.mocked(fetchPostgresSchema).mockResolvedValue({ tables: [] } as never);
    jest.mocked(listSchemaNames).mockReturnValue(["public"]);
    jest.mocked(schemaToDbml).mockReturnValue({
      dbml: "Table users { id int }",
      droppedCrossSchemaRefs: 0,
    });
    jest.mocked(window.showSaveDialog).mockResolvedValue({
      fsPath: "/tmp/public.dbml",
    } as never);
    jest.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);
    jest
      .mocked(window.showTextDocument)
      .mockRejectedValue(new Error("editor failed"));

    await importFromDatabase(fakeContext(), "postgres://u:p@h/db");

    expect(workspace.fs.writeFile).toHaveBeenCalled();
    expect(window.showErrorMessage).toHaveBeenCalledWith(
      "The DBML file was saved, but opening it or the diagram failed.",
    );
  });

  test("still warns about dropped refs and offers to save the connection when opening fails", async () => {
    const { map, context } = fakeSecretsContext();
    jest.mocked(fetchPostgresSchema).mockResolvedValue({ tables: [] } as never);
    jest.mocked(listSchemaNames).mockReturnValue(["public"]);
    jest.mocked(schemaToDbml).mockReturnValue({
      dbml: "Table users { id int }",
      droppedCrossSchemaRefs: 2,
    });
    jest.mocked(window.showSaveDialog).mockResolvedValue({
      fsPath: "/tmp/public.dbml",
    } as never);
    jest.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);
    jest
      .mocked(window.showTextDocument)
      .mockRejectedValue(new Error("editor failed"));
    // First quick pick is the connection chooser, the second is the save prompt.
    jest.mocked(window.showQuickPick).mockImplementation((async (
      items: unknown,
    ) => {
      const list = items as Array<{ pickKind?: string }>;
      return list.find((item) => item?.pickKind === "new") ?? "Yes";
    }) as never);
    jest
      .mocked(window.showInputBox)
      .mockResolvedValueOnce("postgres://u:p@h/db")
      .mockResolvedValueOnce("saved-local");

    await importFromDatabase(context);

    expect(window.showInformationMessage).toHaveBeenCalledWith(
      "2 cross-schema reference(s) were omitted.",
    );
    expect(map.get("dbml.connections")).toBe(
      JSON.stringify({ "saved-local": "postgres://u:p@h/db" }),
    );
  });
});
