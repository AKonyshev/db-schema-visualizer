// One fake client for the whole suite: the queries under test are one round
// trip each, and what matters is the SQL that goes out, the names that come
// back, and that the socket is closed on every path.
import { Client } from "pg";

import { DbImportError, DbImportErrorCode } from "../errors";
import { listDatabases } from "../listDatabases";
import { listSchemas } from "../listSchemas";

const connect = jest.fn();
const query = jest.fn();
const end = jest.fn();

jest.mock("pg", () => ({
  Client: jest.fn(() => ({ connect, query, end })),
}));

describe("catalog queries", () => {
  beforeEach(() => {
    jest.mocked(Client).mockClear();
    connect.mockReset().mockResolvedValue(undefined);
    query.mockReset();
    end.mockReset().mockResolvedValue(undefined);
  });

  test("listDatabases skips templates and databases that refuse connections", async () => {
    query.mockResolvedValue({
      rows: [{ name: "billing" }, { name: "orders" }],
    });

    expect(await listDatabases("postgres://u:p@h/entry")).toEqual([
      "billing",
      "orders",
    ]);

    const sql = String(query.mock.calls[0][0]);
    expect(sql).toContain("pg_database");
    expect(sql).toContain("datallowconn");
    expect(sql).toContain("NOT datistemplate");
  });

  test("listSchemas skips the server's own schemas", async () => {
    query.mockResolvedValue({ rows: [{ name: "audit" }, { name: "public" }] });

    expect(await listSchemas("postgres://u:p@h/orders")).toEqual([
      "audit",
      "public",
    ]);

    const sql = String(query.mock.calls[0][0]);
    expect(sql).toContain("pg_namespace");
    expect(sql).toContain("information_schema");
  });

  test("connects to the database named in the string", async () => {
    query.mockResolvedValue({ rows: [] });

    await listSchemas("postgres://u:p@h/orders");

    expect(Client).toHaveBeenCalledWith({
      connectionString: "postgres://u:p@h/orders",
    });
  });

  test("maps a driver failure to a DbImportError and still closes the client", async () => {
    connect.mockRejectedValue({ code: "42501" });

    await expect(listSchemas("postgres://u:p@h/billing")).rejects.toMatchObject(
      {
        code: DbImportErrorCode.ACCESS_DENIED,
      },
    );
    expect(end).toHaveBeenCalled();
  });

  test("rejects a non-postgres string without opening a client", async () => {
    await expect(listDatabases("mysql://u:p@h/db")).rejects.toBeInstanceOf(
      DbImportError,
    );
    expect(Client).not.toHaveBeenCalled();
  });
});
