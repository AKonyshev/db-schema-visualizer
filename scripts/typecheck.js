#!/usr/bin/env node
// Type-checks every workspace package with `tsc --noEmit -p <pkg>/tsconfig.json`.
//
// Whole projects, not individual files: a per-file check (what `tsc-files` does)
// cannot see a package's tsconfig `paths`, its ambient `.d.ts` files, or the
// callers a changed signature just broke. The packages are small — the whole
// sweep runs in a couple of seconds in parallel — so there is no reason to try
// to narrow it down to the staged files.
//
// See docs/typecheck.md for the ways this check has silently broken before.

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const { repoRoot, packageDirs, containsFile } = require("./workspace-packages");

const tsc = require.resolve("typescript/bin/tsc");

const containsTypeScript = (dir) =>
  containsFile(dir, (name) => /\.tsx?$/.test(name));

const dirs = packageDirs();

// A package with TypeScript in it and no tsconfig used to be dropped from the
// sweep without a word, so `typecheck passed` meant "passed, except the ones I
// skipped". That is the same silently-green failure this whole script exists to
// prevent, so it is an error rather than a filter.
const unchecked = dirs.filter(
  (dir) =>
    !fs.existsSync(path.join(dir, "tsconfig.json")) && containsTypeScript(dir),
);

if (unchecked.length > 0) {
  console.error("typecheck: these packages have TypeScript but no tsconfig:");
  for (const dir of unchecked) {
    console.error(`  ${path.relative(repoRoot, dir)}`);
  }
  console.error("add one, or the package is never checked.");
  process.exit(1);
}

const projects = dirs
  .map((dir) => path.join(dir, "tsconfig.json"))
  .filter((tsconfig) => fs.existsSync(tsconfig));

if (projects.length === 0) {
  console.error("typecheck: found no package tsconfig.json files");
  process.exit(1);
}

const check = async (tsconfig) =>
  await new Promise((resolve) => {
    const child = spawn(process.execPath, [tsc, "--noEmit", "-p", tsconfig], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));

    child.on("close", (code) => {
      resolve({
        name: path.basename(path.dirname(tsconfig)),
        ok: code === 0,
        output: output.trim(),
      });
    });
  });

const main = async () => {
  const results = await Promise.all(projects.map(check));
  const failed = results.filter((result) => !result.ok);

  for (const result of failed) {
    console.error(`\n✗ ${result.name}`);
    console.error(result.output);
  }

  if (failed.length > 0) {
    const names = failed.map((result) => result.name).join(", ");
    console.error(`\ntypecheck failed: ${names}`);
    process.exit(1);
  }

  console.log(`typecheck passed (${results.length} packages)`);
};

void main();
