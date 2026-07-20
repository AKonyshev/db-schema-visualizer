jest.mock("db-to-dbml", () => {
  const actual = jest.requireActual(
    "db-to-dbml",
  ) as typeof import("db-to-dbml");
  return {
    ...actual,
    fetchPostgresSchema: jest.fn(),
    listSchemaNames: jest.fn(),
  };
});

jest.mock("schema-diff", () => {
  const actual = jest.requireActual(
    "schema-diff",
  ) as typeof import("schema-diff");
  return {
    ...actual,
    parseDbmlToModel: jest.fn(),
    databaseSchemaToModel: jest.fn(),
    diffSchemas: jest.fn(),
    renderDiffMarkdown: jest.fn(),
  };
});

import { window, workspace } from "vscode";
import {
  DbImportError,
  DbImportErrorCode,
  fetchPostgresSchema,
  listSchemaNames,
} from "db-to-dbml";
import {
  databaseSchemaToModel,
  diffSchemas,
  parseDbmlToModel,
  renderDiffMarkdown,
} from "schema-diff";

import { compareWithDatabase } from "../compareWithDatabase";

type WindowMock = {
  activeTextEditor:
    | { document: { languageId: string; getText: () => string } }
    | undefined;
};

const windowMock = window as unknown as WindowMock;

function fakeContext() {
  return { secrets: {} } as Parameters<typeof compareWithDatabase>[0];
}

function openDbmlEditor(text = "Table users { id int }"): void {
  windowMock.activeTextEditor = {
    document: {
      languageId: "dbml",
      getText: () => text,
    },
  };
}

describe("compareWithDatabase", () => {
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
    windowMock.activeTextEditor = undefined;
    jest.mocked(fetchPostgresSchema).mockReset();
    jest.mocked(listSchemaNames).mockReset();
    jest.mocked(parseDbmlToModel).mockReset();
    jest.mocked(databaseSchemaToModel).mockReset();
    jest.mocked(diffSchemas).mockReset();
    jest.mocked(renderDiffMarkdown).mockReset();
    jest.mocked(window.showErrorMessage).mockReset();
    jest.mocked(window.showWarningMessage).mockReset();
    jest.mocked(window.showTextDocument).mockReset();
    jest.mocked(workspace.openTextDocument).mockReset();
  });

  test("reports a database read error when fetching the schema fails", async () => {
    openDbmlEditor();
    jest
      .mocked(fetchPostgresSchema)
      .mockRejectedValue(
        new DbImportError(DbImportErrorCode.UNREACHABLE, "down"),
      );

    await compareWithDatabase(fakeContext(), "postgres://u:p@h/db");

    expect(window.showErrorMessage).toHaveBeenCalledWith(
      "Could not reach the database host.",
    );
  });

  test("reports a compare error when diffing fails after a successful fetch", async () => {
    openDbmlEditor();
    jest.mocked(fetchPostgresSchema).mockResolvedValue({ tables: [] } as never);
    jest.mocked(listSchemaNames).mockReturnValue(["public"]);
    jest.mocked(parseDbmlToModel).mockReturnValue({} as never);
    jest.mocked(databaseSchemaToModel).mockReturnValue({} as never);
    jest.mocked(diffSchemas).mockImplementation(() => {
      throw new Error("diff blew up");
    });

    await compareWithDatabase(fakeContext(), "postgres://u:p@h/db");

    expect(window.showErrorMessage).toHaveBeenCalledWith(
      "Failed to compare the DBML file with the database.",
    );
  });
});
