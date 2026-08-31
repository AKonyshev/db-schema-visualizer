import { fetchPostgresSchema } from "../fetchPostgresSchema";
import { listSchemaNames } from "../listSchemaNames";
import { postgresToDbml } from "../postgresToDbml";

/**
 * The one suite that talks to a real PostgreSQL.
 *
 * Every other test here hands the connector a fixture, which proves the
 * translation and nothing about the query that feeds it — the shape of
 * `information_schema`, how a serial column reports its type, whether a foreign
 * key comes back with the table it points at. Those are the things a mock
 * agrees with by construction and a database does not.
 *
 * Skipped unless `DBML_TEST_DATABASE_URL` is set, so the sweep on every commit
 * stays offline. `docs/testing.md` says how to raise a database to run it
 * against.
 */
const url = process.env.DBML_TEST_DATABASE_URL;
const describeLive = url === undefined ? describe.skip : describe;
// Narrowed once. Nothing below runs unless the variable is set, which is a
// guarantee `describe.skip` gives and the type system does not see.
const connection = url as unknown as string;

describeLive("against a real PostgreSQL", () => {
  // The connector opens a socket; the default five seconds is tight for a
  // container that has just started.
  jest.setTimeout(30_000);

  it("lists the schemas the database actually has", async () => {
    const names = listSchemaNames(await fetchPostgresSchema(connection));

    expect(names).toContain("public");
    // Postgres' own schemas are not the reader's business.
    expect(names).not.toContain("information_schema");
  });

  it("reads a live schema into DBML that carries its keys and relations", async () => {
    const dbml = await postgresToDbml(connection, "public");

    expect(dbml).toContain('Table "authors"');
    expect(dbml).toContain('Table "books"');

    // A primary key, a not-null, a unique and a foreign key — the four things
    // the diagram draws differently, each read off the live catalogue rather
    // than off a fixture that was written to agree.
    expect(dbml).toMatch(/"id".*\[pk[^\]]*\]/);
    expect(dbml).toMatch(/"email".*not null/);
    expect(dbml).toMatch(/"email".*unique/);
    // Named after the constraint the database holds, pointing from the many
    // side to the one.
    expect(dbml).toMatch(
      /Ref "books_author_id_fkey":"authors"\."id" < "books"\."author_id"/,
    );
  });

  it("brings back the types the database gave the columns", async () => {
    const dbml = await postgresToDbml(connection, "public");

    // Asserted on the DBML rather than on the connector's own output, which is
    // deliberately untyped here — it is whatever `@dbml/connector` returns, and
    // the contract this package offers is the text below.
    //
    // `serial` is the case worth having a live database for: it is not a type
    // Postgres stores. It reports the integer underneath, and a fixture written
    // by hand would happily say `serial` for ever.
    // `int4` and `increment`, not `serial`: the word in the DDL is not a type
    // Postgres stores, and a fixture written by hand would say `serial` for
    // ever.
    expect(dbml).toMatch(/"id"\s+int4\b/);
    expect(dbml).toMatch(/"id".*increment/);
    expect(dbml).toMatch(/"email"\s+varchar\(255\)/);
    expect(dbml).toMatch(/"bio"\s+text/);
  });

  it("refuses a database that is not there, without leaking the password", async () => {
    const wrong = connection.replace(/\/\/[^@]*@/, "//nobody:secret@");

    await expect(postgresToDbml(wrong, "public")).rejects.toThrow();

    await postgresToDbml(wrong, "public").catch((error: unknown) => {
      expect(String((error as Error).message)).not.toContain("secret");
    });
  });
});
