import { parseManifest } from "../catalogManifest";

const valid = {
  version: 1,
  default: "billing/invoices.dbml",
  files: [
    { path: "billing/invoices.dbml", title: "Billing" },
    { path: "users.dbml", title: "People" },
  ],
};

describe("parseManifest", () => {
  it("reads a manifest the scanner wrote", () => {
    expect(parseManifest(valid)).toEqual({
      files: [
        { path: "billing/invoices.dbml", title: "Billing" },
        { path: "users.dbml", title: "People" },
      ],
      defaultPath: "billing/invoices.dbml",
    });
  });

  it("reads an empty catalogue", () => {
    expect(parseManifest({ version: 1, default: null, files: [] })).toEqual({
      files: [],
      defaultPath: null,
    });
  });

  it("refuses anything that is not this version's shape", () => {
    expect(parseManifest(null)).toBeNull();
    expect(parseManifest("{}")).toBeNull();
    expect(parseManifest({ version: 2, default: null, files: [] })).toBeNull();
    expect(parseManifest({ version: 1, default: null })).toBeNull();
    expect(parseManifest({ version: 1, default: null, files: {} })).toBeNull();
  });

  it("refuses entries that are not a path and a title", () => {
    expect(
      parseManifest({ version: 1, default: null, files: [{ path: "a.dbml" }] }),
    ).toBeNull();
    expect(
      parseManifest({
        version: 1,
        default: null,
        files: [{ path: 7, title: "a" }],
      }),
    ).toBeNull();
    expect(
      parseManifest({ version: 1, default: null, files: [null] }),
    ).toBeNull();
  });

  it("refuses a default that names no file in the list", () => {
    // The site asks for `default` before the first render. A name nothing backs
    // would leave a new reader waiting on a request that ends in a 404.
    expect(parseManifest({ ...valid, default: "gone.dbml" })).toBeNull();
  });

  it("refuses a default that is neither a string nor null", () => {
    expect(parseManifest({ ...valid, default: 3 })).toBeNull();
  });
});
