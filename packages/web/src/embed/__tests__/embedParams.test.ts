import { Theme } from "json-table-schema-visualizer/src/types/theme";

import { parseEmbedParams } from "../embedParams";

describe("parseEmbedParams", () => {
  it("reads a path, a table list and a theme", () => {
    expect(
      parseEmbedParams(
        "?src=acl.dbml&tables=analysis,analysis_liquid&theme=dark",
      ),
    ).toEqual({
      ok: true,
      params: {
        src: "acl.dbml",
        tables: ["analysis", "analysis_liquid"],
        theme: Theme.dark,
      },
    });
  });

  it("reads a nested path", () => {
    expect(parseEmbedParams("?src=integration/asodu.dbml")).toEqual({
      ok: true,
      params: {
        src: "integration/asodu.dbml",
        tables: null,
        theme: Theme.light,
      },
    });
  });

  // The macro writes the query, but a reader can edit the address bar, and a
  // half-written attribute in a page is a real thing to survive.
  it("trims the names and drops empty ones", () => {
    expect(
      parseEmbedParams("?src=acl.dbml&tables=%20analysis%20,,analysis_liquid"),
    ).toEqual({
      ok: true,
      params: {
        src: "acl.dbml",
        tables: ["analysis", "analysis_liquid"],
        theme: Theme.light,
      },
    });
  });

  it("treats an empty table list as no filter at all", () => {
    expect(parseEmbedParams("?src=acl.dbml&tables=")).toEqual({
      ok: true,
      params: { src: "acl.dbml", tables: null, theme: Theme.light },
    });
  });

  // Light rather than a refusal: the theme does not change what the diagram
  // means, and there is nothing to gain from failing the block over it.
  it("falls back to light for a theme it does not know", () => {
    expect(parseEmbedParams("?src=acl.dbml&theme=solarized")).toEqual({
      ok: true,
      params: { src: "acl.dbml", tables: null, theme: Theme.light },
    });
  });

  it("refuses a missing or empty path", () => {
    expect(parseEmbedParams("")).toEqual({
      ok: false,
      error: { kind: "srcMissing" },
    });
    expect(parseEmbedParams("?src=")).toEqual({
      ok: false,
      error: { kind: "srcMissing" },
    });
  });

  // The path is joined to `/schemas/` by `loadSchemaText`. A leading slash or a
  // `..` segment would aim it somewhere else, and a documentation page must not
  // be able to do that by accident.
  it("refuses a path that leaves the catalogue", () => {
    expect(parseEmbedParams("?src=/acl.dbml")).toEqual({
      ok: false,
      error: { kind: "srcInvalid", value: "/acl.dbml" },
    });
    expect(parseEmbedParams("?src=../../etc/passwd")).toEqual({
      ok: false,
      error: { kind: "srcInvalid", value: "../../etc/passwd" },
    });
    expect(parseEmbedParams("?src=a/../../b.dbml")).toEqual({
      ok: false,
      error: { kind: "srcInvalid", value: "a/../../b.dbml" },
    });
    expect(parseEmbedParams("?src=https://example.com/x.dbml")).toEqual({
      ok: false,
      error: { kind: "srcInvalid", value: "https://example.com/x.dbml" },
    });
  });
});
