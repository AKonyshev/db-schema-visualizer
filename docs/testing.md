# Tests

`yarn test` runs every package's suite, one package at a time
(`scripts/test.js`). A single package on its own is still
`yarn workspace <name> test` — the sweep runs exactly that command for each
package, so there is no second way to invoke a suite that could drift from the
first.

Unlike `yarn typecheck`, this does **not** run on commit. It takes ~25 seconds,
most of it `ts-jest` compiling; the pre-commit hook stays fast.

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
