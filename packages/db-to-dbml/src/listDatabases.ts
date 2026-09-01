import { queryCatalogNames } from "./queryCatalogNames";

// `template0`/`template1` are not databases anyone imports, and one that
// refuses connections cannot be read at all — offering either would only
// produce a failure the user has to interpret. Note that this still lists
// databases the user has no rights to: PostgreSQL shows them in the catalogue,
// and finding out costs a connection attempt (see ACCESS_DENIED).
const SQL = `
  SELECT datname AS name
  FROM pg_database
  WHERE datallowconn AND NOT datistemplate
  ORDER BY datname
`;

export async function listDatabases(
  connectionString: string,
): Promise<string[]> {
  return await queryCatalogNames(connectionString, SQL);
}
