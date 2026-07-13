export interface SecretStore {
  get(key: string): Thenable<string | undefined>;
  store(key: string, value: string): Thenable<void>;
}

const KEY = "dbml.connections";

async function readAll(secrets: SecretStore): Promise<Record<string, string>> {
  const raw = await secrets.get(KEY);
  if (raw == null || raw === "") {
    return {};
  }
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeAll(
  secrets: SecretStore,
  all: Record<string, string>,
): Promise<void> {
  await secrets.store(KEY, JSON.stringify(all));
}

export async function listConnections(secrets: SecretStore): Promise<string[]> {
  return Object.keys(await readAll(secrets)).sort();
}

export async function getConnection(
  secrets: SecretStore,
  name: string,
): Promise<string | undefined> {
  return (await readAll(secrets))[name];
}

export async function saveConnection(
  secrets: SecretStore,
  name: string,
  connectionString: string,
): Promise<void> {
  const all = await readAll(secrets);
  all[name] = connectionString;
  await writeAll(secrets, all);
}

export async function deleteConnection(
  secrets: SecretStore,
  name: string,
): Promise<void> {
  const all = await readAll(secrets);
  delete all[name];
  await writeAll(secrets, all);
}
