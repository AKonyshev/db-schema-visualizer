import { queryCatalogNames } from "./queryCatalogNames";

// Reads the schemas of whatever database the string points at — pair it with
// `withDatabase` to ask about another one. `pg\_%` covers pg_catalog, pg_toast
// and the per-session pg_temp_N schemas in one pattern; the backslash is the
// LIKE escape character, doubled here for the JavaScript literal.
const SQL = `
  SELECT nspname AS name
  FROM pg_namespace
  WHERE nspname NOT LIKE 'pg\\_%' AND nspname <> 'information_schema'
  ORDER BY nspname
`;

export async function listSchemas(connectionString: string): Promise<string[]> {
  return await queryCatalogNames(connectionString, SQL);
}
