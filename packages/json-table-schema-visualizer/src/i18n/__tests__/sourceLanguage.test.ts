import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

// English is the source language of this repository. Anything else in the
// sources is either an untranslated comment or a hardcoded user-facing string
// that bypassed the message catalog — both are defects.
//
// The scan runs in Node rather than through `git grep` deliberately: this
// repo's git build silently matches NOTHING for \p{Script=...} patterns, and
// byte-matches false positives when given a literal non-ASCII character range.
// Either behaviour would make this test permanently green and useless. Node's
// RegExp with the `u` flag handles Unicode script properties correctly.
//
// If you change this guard, first verify it still FAILS on known-bad input.
const NON_ENGLISH = /[\p{Script=Cyrillic}\p{Script=Han}]/u;

const EXCLUDED = ["src/i18n/locales/", "/l10n/", "package.nls"];

const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf-8",
}).trim();

function listSourceFiles(): string[] {
  const output = execFileSync(
    "git",
    [
      "ls-files",
      "packages/*/src/**/*.ts",
      "packages/*/src/**/*.tsx",
      "packages/*/extension/**/*.ts",
    ],
    { cwd: repoRoot, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
  );

  return output
    .split("\n")
    .filter((file) => file.trim() !== "")
    .filter((file) => !EXCLUDED.some((excluded) => file.includes(excluded)));
}

describe("source language", () => {
  test("sources contain no Cyrillic or CJK outside locale files", () => {
    const offenders: string[] = [];

    for (const file of listSourceFiles()) {
      const contents = readFileSync(path.join(repoRoot, file), "utf-8");
      contents.split("\n").forEach((line, index) => {
        if (NON_ENGLISH.test(line)) {
          offenders.push(`${file}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    // The failure must name file, line and the offending text: a bare count
    // gives a developer nothing to act on.
    if (offenders.length > 0) {
      throw new Error(
        `English is the source language, but non-English text was found:\n${offenders.join("\n")}`,
      );
    }
    expect(offenders).toEqual([]);
  });
});
