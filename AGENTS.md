# Agent guide

Conventions agents should follow when working in this repository.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, used verbatim (`needs-triage`, `needs-info`,
`ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Type checking and tests

`yarn typecheck` checks every package and `yarn test` runs every package's
suite. Both run on every commit, invoked from `.husky/pre-commit` rather than
through lint-staged, because neither takes a file list.

Package `tsconfig.json` files must stay strict JSON (no comments) —
`jest.config.js` files `require()` them.

Both scripts discover packages through `scripts/workspace-packages.js`, and both
fail loudly rather than skipping: a package with TypeScript and no tsconfig, or
with test files and no `test` script, is an error and is named.

Read `docs/typecheck.md` and `docs/testing.md` before changing the tsconfigs,
the lint-staged config, the husky hook, a package's `test` script, or anything
under `scripts/`. Both documents exist because these checks have silently passed
everything before.
