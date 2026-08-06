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

## Type checking

`yarn typecheck` checks every package; it also runs on every commit. Package
`tsconfig.json` files must stay strict JSON (no comments) — `jest.config.js`
`require()`s them. See `docs/typecheck.md` before changing the tsconfigs, the
lint-staged config, or `scripts/typecheck.js`.
