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

const repoRoot = path.resolve(__dirname, "..");
const packagesDir = path.join(repoRoot, "packages");
const tsc = require.resolve("typescript/bin/tsc");

const projects = fs
  .readdirSync(packagesDir)
  .map((name) => path.join(packagesDir, name, "tsconfig.json"))
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
