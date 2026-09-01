jest.mock("db-to-dbml", () => {
  const actual = jest.requireActual(
    "db-to-dbml",
  ) as typeof import("db-to-dbml");
  return {
    ...actual,
    listDatabases: jest.fn(),
    listSchemas: jest.fn(),
  };
});

import type { SecretStorage } from "vscode";
import { listDatabases, listSchemas } from "db-to-dbml";

import { ConnectionsTreeProvider } from "../connectionsTreeProvider";

// The provider only ever reads, and `getConnection` reads the one
// `dbml.connections` key — so one `get` double is the whole secret store.
const get = jest.fn();
const secrets = {
  get,
  store: jest.fn(),
  delete: jest.fn(),
  onDidChange: jest.fn(),
} as unknown as SecretStorage;

describe("ConnectionsTreeProvider", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.mocked(listDatabases).mockReset();
    jest.mocked(listSchemas).mockReset();
    get
      .mockReset()
      .mockResolvedValue(JSON.stringify({ prod: "postgres://u:p@h/entry" }));
  });

  afterEach(() => {
    jest.mocked(console.error).mockRestore();
  });

  test("expands a connection into the server's databases", async () => {
    jest.mocked(listDatabases).mockResolvedValue(["billing", "orders"]);

    const children = await new ConnectionsTreeProvider(secrets).getChildren({
      kind: "connection",
      name: "prod",
    });

    expect(children).toEqual([
      { kind: "database", connectionName: "prod", databaseName: "billing" },
      { kind: "database", connectionName: "prod", databaseName: "orders" },
    ]);
  });

  test("expands a database into its schemas, read from that database", async () => {
    jest.mocked(listSchemas).mockResolvedValue(["audit", "public"]);

    const children = await new ConnectionsTreeProvider(secrets).getChildren({
      kind: "database",
      connectionName: "prod",
      databaseName: "orders",
    });

    expect(listSchemas).toHaveBeenCalledWith("postgres://u:p@h/orders");
    expect(children).toEqual([
      {
        kind: "schema",
        connectionName: "prod",
        databaseName: "orders",
        schemaName: "audit",
      },
      {
        kind: "schema",
        connectionName: "prod",
        databaseName: "orders",
        schemaName: "public",
      },
    ]);
  });

  test("shows an error node instead of throwing when a server cannot be read", async () => {
    jest.mocked(listDatabases).mockRejectedValue(new Error("unreachable"));

    const children = await new ConnectionsTreeProvider(secrets).getChildren({
      kind: "connection",
      name: "prod",
    });

    expect(children).toEqual([
      { kind: "error", label: "Could not read the list of databases" },
    ]);
  });

  test("shows an error node when the connection has been deleted meanwhile", async () => {
    get.mockResolvedValue(JSON.stringify({}));

    const children = await new ConnectionsTreeProvider(secrets).getChildren({
      kind: "connection",
      name: "prod",
    });

    expect(children).toEqual([
      { kind: "error", label: "This connection is no longer available" },
    ]);
  });

  test("marks the node kinds so the context menus can tell them apart", () => {
    const provider = new ConnectionsTreeProvider(secrets);

    expect(
      provider.getTreeItem({ kind: "connection", name: "prod" }).contextValue,
    ).toBe("dbmlConnection");
    expect(
      provider.getTreeItem({
        kind: "database",
        connectionName: "prod",
        databaseName: "orders",
      }).contextValue,
    ).toBe("dbmlDatabase");
    expect(
      provider.getTreeItem({
        kind: "schema",
        connectionName: "prod",
        databaseName: "orders",
        schemaName: "audit",
      }).contextValue,
    ).toBe("dbmlSchema");
  });
});
