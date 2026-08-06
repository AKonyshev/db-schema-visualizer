# Type checking

`yarn typecheck` runs `tsc --noEmit -p <package>/tsconfig.json` for every package
under `packages/`, in parallel (`scripts/typecheck.js`). The whole sweep takes a
couple of seconds. It runs on every commit via `lint-staged` → husky `pre-commit`.

## Why whole projects rather than the staged files

A per-file check (what `tsc-files` does) cannot see a package's `paths` aliases or
its ambient `.d.ts` files, so it reports errors that are not real. It also cannot
see the _callers_ a changed signature just broke, so it misses errors that are.
Checking whole projects avoids both, and avoids having to map staged files back to
the package that owns them.

It matters here specifically because `extension-shared` and `dbml-vs-code-extension`
compile `json-table-schema-visualizer` sources under their own compiler options. A
change in the visualizer can break them without breaking the visualizer's own build.

## Four traps that made this silently pass everything

These are the ways the check has broken before. Preserve them when editing.

**1. A function value in `.lintstagedrc.js` does not receive the staged filenames.**
lint-staged uses the returned string verbatim. The config used to read
`() => "yarn tsc-files --noEmit"`, so it ran with no input files, and `tsc-files`
with no files exits 0 — every type error passed. Only use the function form for
commands that must _not_ get a file list, like `yarn typecheck`.

**2. `include`/`exclude` resolve relative to the config that declares them,
not the one that inherits them.** The root `tsconfig.json` used to declare
`include: ["**/*.ts", "**/*.tsx"]`, which meant every package extending it
type-checked the entire monorepo. That produced hundreds of phantom errors and
made the real ones unfindable. The root config is now compiler options only —
each package declares its own `include`.

**3. Package `tsconfig.json` files must stay strict JSON — no comments.**
`tsc` accepts JSONC, but five `jest.config.js` files do
`require("./tsconfig.json")` to reuse `compilerOptions.paths`, and Node's JSON
parser rejects comments. A comment in a package tsconfig breaks that package's
tests. Explanations belong here instead.

**4. A package with no `tsconfig.json` used to be skipped without a word.**
`scripts/typecheck.js` built its list by filtering for configs that exist, so
`packages/shared` — six `.ts` files, no config — was never checked, while the
summary still read `typecheck passed`. The script now treats a package that
contains TypeScript and has no config as an error and names it. Adding a package
therefore means adding its tsconfig; there is no way to opt out quietly.

`packages/shared` then turned out to have the same hole in its tests — a jest
config, three tests, no `test` script — so `scripts/test.js` now makes the
matching call for a package with test files and no way to run them. See
[testing.md](./testing.md); the two scripts share their package discovery.

## What `@/` maps to

In `json-table-schema-visualizer` the alias points at that package's own `src`.
In `extension-shared`, `dbml-vs-code-extension` and `web` it points at the
visualizer's `src` instead, because those packages compile the visualizer's
components and those components import each other through the alias.

The consequence is that `@/` is not available for a package's own modules — code
in the three host packages uses relative paths for its own files. Pointing the
alias at both locations would resolve a name to whichever came first in the list,
silently, so it is deliberately mapped to one.

## Vendored JavaScript

`packages/json-table-schema-visualizer/src/export/svg/svgcanvas.esm.js` is
third-party. It is typed by a hand-written `svgcanvas.esm.d.ts` beside it, which
TypeScript resolves in preference to the `.js`, so the vendored file never enters
the program and no `allowJs` is needed. Type-checking it directly produced 365
errors in code we do not maintain.
