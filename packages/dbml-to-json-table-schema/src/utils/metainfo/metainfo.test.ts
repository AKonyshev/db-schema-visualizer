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

  test("keeps an arrangement per detail level, all in the one block", () => {
    const dbml = `${baseDbml}
/*MetaInfo
[{"name":"users","x":10,"y":20,"detailLevel":"HeaderOnly"},
{"name":"users","x":300,"y":400,"detailLevel":"FullDetails"}]
MetaInfo*/`;

    const schema = parseDBMLToJSON(dbml);

    // One entry per table per level, rather than a block keyed by level: it
    // keeps the block a flat array, which is what every reader written before
    // this parses it as.
    expect(
      schema.tables.find((t) => t.name === "users")?.metaInfoPositions,
    ).toEqual({
      HeaderOnly: { x: 10, y: 20 },
      FullDetails: { x: 300, y: 400 },
    });
  });

  test("leaves x and y on the full-detail arrangement", () => {
    const dbml = `${baseDbml}
/*MetaInfo
[{"name":"users","x":10,"y":20,"detailLevel":"HeaderOnly"},
{"name":"users","x":300,"y":400,"detailLevel":"FullDetails"}]
MetaInfo*/`;

    const users = parseDBMLToJSON(dbml).tables.find((t) => t.name === "users");

    // A reader written before any of this knows only `x` and `y`, and takes
    // whichever entry it saw last. Full detail is the arrangement with the most
    // room in it, so it is the safe one to be left holding.
    expect([users?.x, users?.y]).toEqual([300, 400]);
  });

  test("a block naming no level is still one full-detail arrangement", () => {
    const dbml = `${baseDbml}
/*MetaInfo
[{"name":"users","x":100,"y":200}]
MetaInfo*/`;

    expect(
      parseDBMLToJSON(dbml).tables.find((t) => t.name === "users")
        ?.metaInfoPositions,
    ).toEqual({ FullDetails: { x: 100, y: 200 } });
  });
});
