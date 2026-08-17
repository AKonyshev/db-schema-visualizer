import * as fs from "fs";
import * as path from "path";

import { WEB_VIEW_NAME } from "../constants";

interface Manifest {
  contributes: {
    commands: Array<{ command: string; title: string }>;
    keybindings?: Array<{ command: string; key: string; when?: string }>;
    customEditors?: Array<{
      viewType: string;
      displayName: string;
      priority: string;
      selector: Array<{ filenamePattern: string }>;
    }>;
    menus: Record<
      string,
      Array<{ command: string; when?: string; alt?: string }>
    >;
  };
}

const readJson = <T>(...segments: string[]): T =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "..", ...segments), "utf8"),
  ) as T;

const manifest = (): Manifest => readJson<Manifest>("package.json");

describe("custom editor contribution", () => {
  test("the declared viewType is the one the code registers", () => {
    const editors = manifest().contributes.customEditors ?? [];

    expect(editors).toHaveLength(1);
    expect(editors[0].viewType).toBe(WEB_VIEW_NAME);
    expect(editors[0].priority).toBe("option");
    expect(editors[0].selector).toEqual([{ filenamePattern: "*.dbml" }]);
  });

  test("the preview and source buttons are mutually exclusive", () => {
    const titleMenu = manifest().contributes.menus["editor/title"];
    const preview = titleMenu.find(
      (item) => item.command === "dbml-erd-visualizer.previewDiagrams",
    );
    const source = titleMenu.find(
      (item) => item.command === "dbml-erd-visualizer.showSource",
    );

    // Without the negation both would show at once: resourceLangId stays `dbml`
    // while the diagram is the active editor.
    expect(preview?.when).toBe(
      `resourceLangId == dbml && activeCustomEditorId != '${WEB_VIEW_NAME}'`,
    );
    expect(source?.when).toBe(`activeCustomEditorId == '${WEB_VIEW_NAME}'`);
    expect(preview?.alt).toBe("dbml-erd-visualizer.previewDiagramsInPlace");
  });

  test("the workbench contributes no Alt+H binding", () => {
    // Hiding a table's relations is a view preference the diagram owns; a
    // workbench binding would only steal the chord from the page that handles it.
    expect(manifest().contributes.keybindings ?? []).toEqual([]);
  });

  test("every menu command is a contributed command", () => {
    const { commands, menus } = manifest().contributes;
    const declared = new Set(commands.map((command) => command.command));

    for (const items of Object.values(menus)) {
      for (const item of items) {
        expect(declared.has(item.command)).toBe(true);
        if (item.alt !== undefined) {
          expect(declared.has(item.alt)).toBe(true);
        }
      }
    }
  });
});

describe("manifest translations", () => {
  // A missing key falls back to English silently, which is how the panel
  // shipped half-translated once already.
  const collectNlsKeys = (value: unknown): string[] => {
    if (typeof value === "string") {
      const match = /^%(.+)%$/.exec(value);
      return match === null ? [] : [match[1]];
    }
    if (Array.isArray(value)) {
      return value.flatMap(collectNlsKeys);
    }
    if (value !== null && typeof value === "object") {
      return Object.values(value).flatMap(collectNlsKeys);
    }
    return [];
  };

  test.each([
    "package.nls.json",
    "package.nls.ru.json",
    "package.nls.zh-cn.json",
  ])("%s defines every key the manifest references", (file) => {
    const used = new Set(collectNlsKeys(manifest()));
    const defined = readJson<Record<string, string>>(file);
    const missing = [...used].filter((key) => !(key in defined));

    expect(missing).toEqual([]);
  });
});
