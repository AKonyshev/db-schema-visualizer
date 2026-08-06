# Tests

`yarn test` runs every package's suite, one package at a time
(`scripts/test.js`). A single package on its own is still
`yarn workspace <name> test` — the sweep runs exactly that command for each
package, so there is no second way to invoke a suite that could drift from the
first.

It runs on every commit, from `.husky/pre-commit` — after `lint-staged`, not
inside it. The suites are repo-wide, so there is no file list to give them and
nothing about which files are staged narrows what has to run. That costs ~25
seconds per commit, most of it `ts-jest` compiling.

Two things follow from where it sits:

- The hook needs `set -e`. A shell script exits with the status of its last
  command, so without it a `lint-staged` failure followed by a passing test run
  would exit 0 and commit the type errors anyway.
- `lint-staged` stashes unstaged changes for the duration of its own run; this
  does not. `yarn test` tests the working tree rather than the staged snapshot,
  so with a dirty tree it can pass on code the commit does not contain.

## Each package owns its own suite

A package's `test` script and its `jest.config.js` are the package's business.
Most pass `--collectCoverage`; `dbml-schema-visualizer` deliberately does not.
`scripts/test.js` runs the declared script rather than invoking jest itself, so
those choices keep working and adding a package needs no change here.

The output is passed straight through instead of being buffered and summarized.
A sweep whose result you have to trust rather than read is how the failure below
survived.

## The trap: a package with tests and no `test` script

`packages/shared` had a correct `jest.config.js` and three passing tests, and no
`scripts` block at all. `yarn workspace shared test` therefore failed to find a
script, and because every suite was invoked by hand there was no aggregate run
to notice. The tests had not executed since they were written.

`scripts/test.js` treats a package that contains `*.test.ts` files and declares
no `test` script as an error, names it, and exits before running anything. This
is the same call `scripts/typecheck.js` makes for a package that contains
TypeScript and has no `tsconfig.json` — see trap 4 in
[typecheck.md](./typecheck.md). In both cases the alternative is a green summary
that quietly means "passed, except the ones I skipped".

The two sweeps share their package discovery (`scripts/workspace-packages.js`)
so that "which packages exist" cannot answer differently for tests than it does
for types.
