import { type CatalogFile } from "../catalogManifest";
import { fileNameOf } from "../catalogPath";
import { buildTree, filterTree, type CatalogNode } from "../catalogTree";

const file = (path: string, title = path): CatalogFile => ({ path, title });

// The shape assertions below read as a sketch rather than as nested objects: a
// tree written out in full is a tree nobody checks a second time.
const sketch = (nodes: CatalogNode[]): string[] =>
  nodes.flatMap((node) =>
    node.kind === "folder"
      ? [`${node.path}/`, ...sketch(node.children).map((line) => `  ${line}`)]
      : [node.file.path],
  );

describe("fileNameOf", () => {
  it("takes the last segment", () => {
    expect(fileNameOf("billing/invoices.dbml")).toBe("invoices.dbml");
    expect(fileNameOf("users.dbml")).toBe("users.dbml");
  });
});

describe("buildTree", () => {
  it("nests folders and keeps files at their level", () => {
    expect(
      sketch(
        buildTree([
          file("users.dbml"),
          file("billing/invoices.dbml"),
          file("billing/eu/vat.dbml"),
        ]),
      ),
    ).toEqual([
      "billing/",
      "  billing/eu/",
      "    billing/eu/vat.dbml",
      "  billing/invoices.dbml",
      "users.dbml",
    ]);
  });

  it("puts folders before files and sorts each group", () => {
    expect(
      sketch(buildTree([file("a.dbml"), file("z/one.dbml"), file("b.dbml")])),
    ).toEqual(["z/", "  z/one.dbml", "a.dbml", "b.dbml"]);
  });

  it("keeps same-named files in different folders apart", () => {
    expect(
      sketch(buildTree([file("a/schema.dbml"), file("b/schema.dbml")])),
    ).toEqual(["a/", "  a/schema.dbml", "b/", "  b/schema.dbml"]);
  });

  it("has nothing to show for no files", () => {
    expect(buildTree([])).toEqual([]);
  });
});

describe("filterTree", () => {
  const tree = buildTree([
    file("billing/invoices.dbml", "Invoices"),
    file("billing/payments.dbml", "Payments"),
    file("users.dbml", "People"),
  ]);

  it("keeps everything for an empty query", () => {
    expect(sketch(filterTree(tree, ""))).toEqual(sketch(tree));
  });

  it("matches on the title", () => {
    expect(sketch(filterTree(tree, "peo"))).toEqual(["users.dbml"]);
  });

  it("matches on the path, and keeps the folders leading to a match", () => {
    expect(sketch(filterTree(tree, "invoic"))).toEqual([
      "billing/",
      "  billing/invoices.dbml",
    ]);
  });

  it("ignores case", () => {
    expect(sketch(filterTree(tree, "PAYM"))).toEqual([
      "billing/",
      "  billing/payments.dbml",
    ]);
  });

  it("drops a folder whose every file was filtered out", () => {
    expect(filterTree(tree, "nothing-matches-this")).toEqual([]);
  });
});
