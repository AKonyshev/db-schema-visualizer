import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

// The script is shell, so it is tested the way a shell script can be: run it
// against a folder built for the occasion and read what it wrote. The pure
// alternative — reimplementing the extraction in TypeScript and testing that —
// would test a second copy of the logic rather than the one that ships.
//
// What this cannot see is BusyBox: `sh` here is the developer's, and the script
// runs under Alpine's in the image. That is checked by hand, once, against a
// built container.
const SCRIPT = join(
  __dirname,
  "..",
  "..",
  "..",
  "docker",
  "schema-manifest.sh",
);

interface Manifest {
  version: number;
  default: string | null;
  files: Array<{ path: string; title: string }>;
}

const folder = (): string => mkdtempSync(join(tmpdir(), "dbml-schemas-"));

const write = (root: string, relative: string, contents: string): void => {
  const target = join(root, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, "utf8");
};

const run = (
  schemasDir: string,
  defaultPath = "",
): { manifest: Manifest; raw: string } => {
  const manifestPath = join(
    mkdtempSync(join(tmpdir(), "dbml-manifest-")),
    "index.json",
  );

  execFileSync("sh", [SCRIPT], {
    env: {
      ...process.env,
      SCHEMAS_DIR: schemasDir,
      SCHEMAS_MANIFEST: manifestPath,
      SCHEMAS_DEFAULT: defaultPath,
    },
  });

  const raw = readFileSync(manifestPath, "utf8");

  return { manifest: JSON.parse(raw) as Manifest, raw };
};

describe("schema-manifest.sh", () => {
  it("names a file by its DBML Project block", () => {
    const root = folder();
    write(
      root,
      "billing.dbml",
      "Project Billing {\n  database_type: 'PostgreSQL'\n}\n",
    );

    expect(run(root).manifest.files).toEqual([
      { path: "billing.dbml", title: "Billing" },
    ]);
  });

  it("falls back to the first comment line, then to the file name", () => {
    const root = folder();
    write(
      root,
      "commented.dbml",
      "// Orders and shipments\nTable orders {\n  id integer\n}\n",
    );
    write(root, "bare.dbml", "Table users {\n  id integer\n}\n");

    expect(run(root).manifest.files).toEqual([
      { path: "bare.dbml", title: "bare" },
      { path: "commented.dbml", title: "Orders and shipments" },
    ]);
  });

  it("walks sub-folders and sorts by path", () => {
    const root = folder();
    write(root, "zebra.dbml", "Table z {\n  id integer\n}\n");
    write(root, "billing/invoices.dbml", "Project Invoices {\n}\n");
    write(root, "billing/payments.dbml", "Project Payments {\n}\n");

    expect(run(root).manifest.files.map((file) => file.path)).toEqual([
      "billing/invoices.dbml",
      "billing/payments.dbml",
      "zebra.dbml",
    ]);
  });

  it("ignores everything that is not a .dbml file", () => {
    const root = folder();
    write(root, "README.md", "# not a schema\n");
    write(root, "secrets.env", "TOKEN=1\n");
    write(root, "users.dbml", "Table users {\n  id integer\n}\n");

    expect(run(root).manifest.files.map((file) => file.path)).toEqual([
      "users.dbml",
    ]);
  });

  it("points default at the first file, or at the one asked for", () => {
    const root = folder();
    write(root, "a.dbml", "Table a {\n  id integer\n}\n");
    write(root, "b.dbml", "Table b {\n  id integer\n}\n");

    expect(run(root).manifest.default).toBe("a.dbml");
    expect(run(root, "b.dbml").manifest.default).toBe("b.dbml");
    // An override naming a file that is not there is ignored rather than
    // written out: the site asks for it before the first render, and a name
    // nothing backs would greet a new reader with a failed request.
    expect(run(root, "gone.dbml").manifest.default).toBe("a.dbml");
  });

  it("writes an empty catalogue for a missing or empty folder", () => {
    const empty = folder();

    expect(run(empty).manifest).toEqual({
      version: 1,
      default: null,
      files: [],
    });

    expect(run(join(empty, "no-such-folder")).manifest.files).toEqual([]);
  });

  it("escapes what would otherwise break the JSON", () => {
    const root = folder();
    write(
      root,
      "quoted.dbml",
      '// A "quoted" \\ title\nTable t {\n  id integer\n}\n',
    );

    const { manifest, raw } = run(root);

    expect(() => JSON.parse(raw)).not.toThrow();
    expect(manifest.files[0].title).toBe('A "quoted" \\ title');
  });

  it("escapes the control characters JSON has no room for", () => {
    const root = folder();
    // A byte nobody typed on purpose — a stray \x01 pasted along with a title,
    // or a form feed left by an editor. Written through raw it makes the
    // manifest unparseable, and an unparseable manifest is not one bad row: it
    // is the whole catalogue gone, for every reader, over one file.
    write(
      root,
      "control.dbml",
      "// Ledger\u0001 export\u000c\nTable t {\n  id integer\n}\n",
    );

    const { manifest, raw } = run(root);

    expect(() => JSON.parse(raw)).not.toThrow();
    expect(manifest.files[0].title).toBe("Ledger\u0001 export\u000c");
  });

  it("stays valid JSON when a file name contains a newline", () => {
    const root = folder();
    write(root, "we\nird.dbml", "Table w {\n  id integer\n}\n");
    write(root, "sane.dbml", "Table s {\n  id integer\n}\n");

    const { manifest, raw } = run(root);

    // The listing is line-based, so such a name reaches the scanner in pieces
    // that name no file. Skipped rather than written out as an entry that would
    // 404 the moment a reader clicked it.
    expect(() => JSON.parse(raw)).not.toThrow();
    expect(manifest.files).toEqual([{ path: "sane.dbml", title: "sane" }]);
  });
});
