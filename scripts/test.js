#!/usr/bin/env node
// Runs every workspace package's test suite, one package after another.
//
// It shells out to `yarn workspace <name> test` rather than invoking jest
// itself, because each package owns both its jest config and the flags it wants
// (whether a suite collects coverage is the package's own choice — see
// docs/testing.md, which is the one place that records which do).
// The sweep therefore runs exactly what a person runs by hand — there is no
// second, subtly different way to execute the suites.
//
// Serially, and with the child output passed straight through: a run whose
// output you have to trust rather than read is how `packages/shared` went a
// release with three tests nobody ran.
//
// See docs/testing.md.

const { spawn } = require("node:child_process");
const path = require("node:path");

const {
  repoRoot,
  packageDirs,
  containsFile,
  readPackageJson,
} = require("./workspace-packages");

const packages = packageDirs().map((dir) => {
  const manifest = readPackageJson(dir);

  return {
    dir,
    name: manifest?.name,
    hasTestScript: Boolean(manifest?.scripts?.test),
    hasTestFiles: containsFile(dir, (file) => /\.test\.tsx?$/.test(file)),
  };
});

// The gap this script closes: `packages/shared` had a jest config, three
// passing tests and no `test` script, so `yarn workspace shared test` failed to
// find a script and no aggregate run ever reached it. Silently skipping such a
// package would leave the same hole one level up, so it is an error — the same
// call as `typecheck.js` makes for a package with TypeScript and no tsconfig.
const unrun = packages.filter((pkg) => pkg.hasTestFiles && !pkg.hasTestScript);

if (unrun.length > 0) {
  console.error("test: these packages have test files but no `test` script:");
  for (const pkg of unrun) {
    console.error(`  ${path.relative(repoRoot, pkg.dir)}`);
  }
  console.error('add `"test": "jest"` to package.json, or nothing runs them.');
  process.exit(1);
}

const suites = packages.filter((pkg) => pkg.hasTestScript);

if (suites.length === 0) {
  console.error("test: found no package with a `test` script");
  process.exit(1);
}

const run = async (pkg) =>
  await new Promise((resolve) => {
    const child = spawn("yarn", ["workspace", pkg.name, "test"], {
      cwd: repoRoot,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      resolve(code === 0);
    });
  });

const main = async () => {
  const failed = [];

  for (const pkg of suites) {
    console.log(`\n━━ ${pkg.name} ━━`);
    if (!(await run(pkg))) failed.push(pkg.name);
  }

  if (failed.length > 0) {
    console.error(`\ntests failed: ${failed.join(", ")}`);
    process.exit(1);
  }

  console.log(`\ntests passed (${suites.length} packages)`);
};

void main();
