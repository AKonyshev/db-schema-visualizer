// Note on the function form below: when a lint-staged value is a function, its
// return string is used VERBATIM and the staged filenames are NOT appended.
// That is a footgun — this config used to read `() => "yarn tsc-files --noEmit"`,
// which therefore ran with no input files, and `tsc-files` with no files exits 0.
// The pre-commit typecheck silently passed everything.
//
// Here the function form is deliberate and correct: `yarn typecheck` checks whole
// tsconfig projects, so it must NOT receive a file list. Anything that should see
// the staged filenames has to stay a plain string, as the entries below are.

module.exports = {
  // Commands within a single glob run in order, so autofix and format first,
  // then type-check whatever they left behind.
  "*.{ts,tsx}": ["eslint --fix", "prettier --write", () => "yarn typecheck"],
  "*.js": ["eslint --fix", "prettier --write"],
  "*.{md,json}": "prettier --write",
};
