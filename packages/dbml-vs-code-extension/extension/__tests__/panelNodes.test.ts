import * as fs from "fs";
import * as path from "path";

import { ACTION_NODES, buildConnectionNodes } from "../panelNodes";

describe("buildConnectionNodes", () => {
  test("returns one connection node per name", () => {
    expect(buildConnectionNodes(["a", "b"])).toEqual([
      { kind: "connection", name: "a" },
      { kind: "connection", name: "b" },
    ]);
  });

  test("returns a single empty node when there are no connections", () => {
    expect(buildConnectionNodes([])).toEqual([
      { kind: "empty", label: "No saved connections" },
    ]);
  });
});

describe("ACTION_NODES / contributed commands", () => {
  test("every action node command id is a contributed command", () => {
    const pkgPath = path.join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      contributes: { commands: Array<{ command: string }> };
    };
    const contributed = new Set(pkg.contributes.commands.map((c) => c.command));
    for (const node of ACTION_NODES) {
      if (node.kind === "action") {
        expect(contributed.has(node.commandId)).toBe(true);
      }
    }
  });
});
