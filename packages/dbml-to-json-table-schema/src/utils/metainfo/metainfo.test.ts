import {
  extractMetaInfo,
  toggleTableRefs,
  upsertMetaInfoInDbml,
} from "./index";

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
    expect(users?.hasHiddenRefs).toBe(true);
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

  test("toggleTableRefs comments and uncomments ref lines", () => {
    const hidden = toggleTableRefs(baseDbml, "users", {
      name: "users",
      x: 0,
      y: 0,
    });
    expect(hidden).toContain("// Ref:");

    const visible = toggleTableRefs(hidden, "users", {
      name: "users",
      x: 0,
      y: 0,
    });
    expect(visible).not.toMatch(/^\s*\/\/\s*Ref:/m);
  });

  test("toggleTableRefs matches schema-qualified ref syntax", () => {
    const dbml = `
Table "well_design.well" {
  "id" uuid [pk]
}

Table "well_design.bore" {
  "well_id" uuid
}

Ref "bore_well_id_fkey":"well_design.well"."id" < "well_design.bore"."well_id"
`;

    const hidden = toggleTableRefs(dbml, "well_design.well", {
      name: "well_design.well",
      x: 0,
      y: 0,
    });
    expect(hidden).toContain(
      '// Ref "bore_well_id_fkey":"well_design.well"."id"',
    );
  });
});
