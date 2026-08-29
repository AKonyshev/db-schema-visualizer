import { extractMetaInfo, upsertMetaInfoInDbml } from "./index";

import { parseDBMLToJSON } from "@/index";

const baseDbml = `
Table users {
  id integer [pk]
}

Table posts {
  id integer [pk]
  user_id integer
}

Ref: posts.user_id > users.id
`;

describe("MetaInfo utilities", () => {
  test("extractMetaInfo returns parsed entries", () => {
    const dbml = `${baseDbml}
/*MetaInfo
[{"name":"users","x":10,"y":20}]
MetaInfo*/`;
    const result = extractMetaInfo(dbml);
    expect(result).toEqual([{ name: "users", x: 10, y: 20 }]);
  });

  test("parseDBMLToJSON applies MetaInfo coordinates", () => {
    const dbml = `${baseDbml}
/*MetaInfo
[{"name":"users","x":100,"y":200,"hidden":true}]
MetaInfo*/`;
    const schema = parseDBMLToJSON(dbml);
    const users = schema.tables.find((t) => t.name === "users");
    expect(users?.x).toBe(100);
    expect(users?.y).toBe(200);
    expect(users?.fromMetaInfo).toBe(true);
  });

  test("upsertMetaInfoInDbml inserts block when missing", () => {
    const result = upsertMetaInfoInDbml(baseDbml, [
      { name: "users", x: 5, y: 15 },
    ]);
    expect(result).toContain("/*MetaInfo");
    expect(result).toContain('"name":"users"');
    expect(result).toContain("MetaInfo*/");
  });

  test("upsertMetaInfoInDbml replaces existing block", () => {
    const withMeta = `${baseDbml}
/*MetaInfo
[{"name":"users","x":1,"y":2}]
MetaInfo*/`;
    const result = upsertMetaInfoInDbml(withMeta, [
      { name: "users", x: 50, y: 60 },
      { name: "posts", x: 70, y: 80 },
    ]);
    expect(result).toContain('"x":50');
    expect(result).toContain('"name":"posts"');
    expect(result.match(/\/\*MetaInfo/g)?.length).toBe(1);
  });

  test("upsertMetaInfoInDbml keeps a hidden flag written by an older version", () => {
    // Hiding relations is a view preference now and nothing writes `hidden` any
    // more, but a file that already carries one is not ours to rewrite.
    const withHidden = `${baseDbml}
/*MetaInfo
[{"name":"users","x":1,"y":2,"hidden":true}]
MetaInfo*/`;

    const result = upsertMetaInfoInDbml(withHidden, [
      { name: "users", x: 50, y: 60 },
    ]);

    expect(result).toContain('"hidden":true');
  });

  test("upsertMetaInfoInDbml records which detail level the layout was made at", () => {
    // One arrangement in the file, and the reader may have made it at any of
    // three detail levels. Which one is not a detail: the tables are laid out
    // by their drawn height, so coordinates made for headers put tables on top
    // of one another if they are read back at full detail. Saying so is what
    // lets them be read back safely — or passed over.
    const result = upsertMetaInfoInDbml(baseDbml, [
      { name: "users", x: 5, y: 15, detailLevel: "HeaderOnly" },
    ]);

    expect(result).toContain('"detailLevel":"HeaderOnly"');
  });

  test("parseDBMLToJSON carries the detail level through to the schema", () => {
    const dbml = `${baseDbml}
/*MetaInfo
[{"name":"users","x":100,"y":200,"detailLevel":"HeaderOnly"}]
MetaInfo*/`;

    const schema = parseDBMLToJSON(dbml);

    expect(
      schema.tables.find((t) => t.name === "users")?.fromMetaInfoDetailLevel,
    ).toBe("HeaderOnly");
  });

  test("reads a block from before the level was written as full detail", () => {
    // Every file written until now holds a full-detail arrangement, because
    // that was the only kind anything wrote. Saying nothing has to go on
    // meaning that, or the layouts already in people's files stop being used.
    const dbml = `${baseDbml}
/*MetaInfo
[{"name":"users","x":100,"y":200}]
MetaInfo*/`;

    const schema = parseDBMLToJSON(dbml);

    expect(
      schema.tables.find((t) => t.name === "users")?.fromMetaInfoDetailLevel,
    ).toBe("FullDetails");
  });
});
