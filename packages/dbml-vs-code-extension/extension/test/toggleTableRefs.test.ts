import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as vscode from "vscode";

const EXTENSION_ID = "konyshevav.dbml-schema-visualizer";

// One table, so the webview's `singleTableName` fallback stands in for the
// hovered table and the whole chain can run without a pointer.
const SAMPLE_DBML = `Table users {
  id int [pk]
  manager_id int
}

Ref: users.manager_id > users.id
`;

const waitFor = async (
  describe: string,
  predicate: () => boolean,
  timeoutMs = 20000,
): Promise<void> => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.fail(`timed out waiting for ${describe}`);
};

suite("toggleTableRefs end to end", () => {
  let uri: vscode.Uri;

  suiteSetup(async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, `extension ${EXTENSION_ID} not found`);
    await extension.activate();
  });

  setup(() => {
    const file = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "dbml-toggle-refs-")),
      "schema.dbml",
    );
    fs.writeFileSync(file, SAMPLE_DBML, "utf8");
    uri = vscode.Uri.file(file);
  });

  teardown(async () => {
    await vscode.commands.executeCommand(
      "workbench.action.closeAllEditors",
      // Nothing here is worth a save prompt between tests.
    );
    await vscode.commands.executeCommand(
      "workbench.action.revertAndCloseActiveEditor",
    );
  });

  test("the command works with the diagram open beside the text", async () => {
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
    await vscode.commands.executeCommand("dbml-erd-visualizer.previewDiagrams");
    // Focus back on the text, which is where the keybinding usually fires from.
    await vscode.window.showTextDocument(document, vscode.ViewColumn.One);

    await vscode.commands.executeCommand("dbml-erd-visualizer.toggleTableRefs");

    await waitFor("the Ref line to be commented", () =>
      /^\s*\/\/\s*Ref:/m.test(document.getText()),
    );
  });

  test("the command comments the refs of the open document", async () => {
    const opened = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(opened);
    await vscode.commands.executeCommand(
      "dbml-erd-visualizer.previewDiagramsInPlace",
    );
    // The command starts its work and returns without awaiting it, so the
    // diagram may not be registered yet; firing the toggle into that gap is a
    // race in the test, not a bug in the feature.
    await waitFor("the diagram tab", () =>
      vscode.window.tabGroups.all
        .flatMap((group) => group.tabs)
        .some(
          (tab) =>
            (tab.input as { viewType?: string } | undefined)?.viewType ===
            "dblm-preview-webview",
        ),
    );

    // Read through a fresh handle every time: closing the text tab can dispose
    // the TextDocument this test opened, and a stale one keeps reporting the
    // text it had then — which reads exactly like the feature not working.
    let latest = "";
    const current = async (): Promise<string> => {
      latest = (await vscode.workspace.openTextDocument(uri)).getText();
      return latest;
    };

    await vscode.commands.executeCommand("dbml-erd-visualizer.toggleTableRefs");

    const startedAt = Date.now();
    while (Date.now() - startedAt < 20000) {
      if (/^\s*\/\/\s*Ref:/m.test(await current())) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    assert.match(
      latest,
      /\/\/ Ref: users\.manager_id > users\.id/,
      `document was disposed: ${String(opened.isClosed)}`,
    );
  });
});
