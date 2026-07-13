import { fetchPostgresSchema } from "./fetchPostgresSchema";
import { schemaToDbml } from "./schemaToDbml";

export async function postgresToDbml(
  connectionString: string,
  schemaName: string,
): Promise<string> {
  const db = await fetchPostgresSchema(connectionString);
  return schemaToDbml(db, schemaName).dbml;
}
