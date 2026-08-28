import { loadCatalog } from "../loadCatalog";
import { loadSchemaText } from "../loadSchemaText";

const respondWith = (body: string, ok = true): void => {
  globalThis.fetch = jest.fn(async () => ({
    ok,
    text: async () => body,
  })) as unknown as typeof fetch;
};

const manifest = JSON.stringify({
  version: 1,
  default: "users.dbml",
  files: [{ path: "users.dbml", title: "People" }],
});

describe("loadCatalog", () => {
  it("reads the manifest the container serves", async () => {
    respondWith(manifest);

    await expect(loadCatalog()).resolves.toEqual({
      files: [{ path: "users.dbml", title: "People" }],
      defaultPath: "users.dbml",
    });
  });

  it("has no catalogue when the manifest is missing", async () => {
    respondWith("not found", false);

    await expect(loadCatalog()).resolves.toBeNull();
  });

  it("has no catalogue when the answer is not the manifest", async () => {
    // What `vite dev` returns for an unknown path: the entry document, with a
    // 200 on it. Parsed as JSON it throws, and that has to read as "no
    // catalogue" rather than as a crash on the first line the page runs.
    respondWith("<!doctype html><html></html>");

    await expect(loadCatalog()).resolves.toBeNull();
  });

  it("gives up rather than holding the first render", async () => {
    globalThis.fetch = jest.fn(
      async (_url: unknown, init?: { signal?: AbortSignal }) =>
        await new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new Error("aborted"));
          });
        }),
    ) as unknown as typeof fetch;

    await expect(loadCatalog(1)).resolves.toBeNull();
  });
});

describe("loadSchemaText", () => {
  it("reads a file out of the catalogue", async () => {
    respondWith("Table users {\n  id integer\n}\n");

    await expect(loadSchemaText("users.dbml")).resolves.toBe(
      "Table users {\n  id integer\n}\n",
    );
  });

  it("encodes each segment of the path", async () => {
    respondWith("Table t {\n}\n");

    await loadSchemaText("bill ing/a&b.dbml");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/schemas/bill%20ing/a%26b.dbml",
      expect.anything(),
    );
  });

  it("says nothing rather than throwing when the file is gone", async () => {
    respondWith("not found", false);

    await expect(loadSchemaText("users.dbml")).resolves.toBeNull();
  });
});
