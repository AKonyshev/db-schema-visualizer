import { Client } from "pg";

import { assertPostgresConnectionString } from "./connectionString";
import { toDbImportError } from "./errors";

// The cheap half of this package. `@dbml/connector` only knows how to read a
// whole database, which is far too much work to answer "what is in here?" while
// the user is expanding a node in a tree. These queries open their own
// short-lived connection, ask one question, and close it.
// Expanding a tree node must not be able to hang. A host that drops packets
// rather than refusing them holds an unbounded connect open for the operating
// system's own timeout — minutes — and `getChildren` has nothing to cancel with.
// These bound both halves of the round trip; a catalogue query that needs more
// than this is a server in trouble, and saying so beats waiting.
const CONNECT_TIMEOUT_MS = 10_000;
const QUERY_TIMEOUT_MS = 15_000;

export async function queryCatalogNames(
  connectionString: string,
  sql: string,
): Promise<string[]> {
  // Outside the try on purpose: a bad string is already a DbImportError, and
  // there is no client to close.
  const client = new Client({
    connectionString: assertPostgresConnectionString(connectionString),
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    query_timeout: QUERY_TIMEOUT_MS,
    statement_timeout: QUERY_TIMEOUT_MS,
  });

  try {
    await client.connect();
    const result = await client.query<{ name: string }>(sql);
    return result.rows.map((row) => row.name);
  } catch (error) {
    throw toDbImportError(error);
  } finally {
    // A failed connect leaves nothing to close and `end` says so quietly; a
    // successful one leaves a socket that an abandoned tree expansion would
    // otherwise keep open.
    await client.end().catch(() => undefined);
  }
}
