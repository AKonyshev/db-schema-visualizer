import {
  listConnections,
  getConnection,
  saveConnection,
  deleteConnection,
  type SecretStore,
} from "../connectionStore";

function fakeSecrets(): SecretStore {
  const map = new Map<string, string>();
  return {
    get: async (k) => map.get(k),
    store: async (k, v) => void map.set(k, v),
  };
}

describe("connectionStore", () => {
  test("save then list and get", async () => {
    const s = fakeSecrets();
    await saveConnection(s, "local", "postgres://u:p@h/db");
    expect(await listConnections(s)).toEqual(["local"]);
    expect(await getConnection(s, "local")).toBe("postgres://u:p@h/db");
  });

  test("delete removes a connection", async () => {
    const s = fakeSecrets();
    await saveConnection(s, "a", "postgres://a");
    await saveConnection(s, "b", "postgres://b");
    await deleteConnection(s, "a");
    expect(await listConnections(s)).toEqual(["b"]);
  });

  test("empty store lists nothing", async () => {
    expect(await listConnections(fakeSecrets())).toEqual([]);
  });
});
