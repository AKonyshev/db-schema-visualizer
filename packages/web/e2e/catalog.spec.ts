import { readFileSync } from "node:fs";

import { expect, test, type Locator, type Page } from "@playwright/test";

// The built site has no catalogue in it — the container's nginx is what puts one
// at these paths. Both are same-origin, so fulfilling them here makes the same
// promise the smoke test checks: nothing the page asks for leaves the origin.
const MANIFEST = {
  version: 1,
  default: "billing/invoices.dbml",
  files: [
    { path: "billing/invoices.dbml", title: "Invoices" },
    { path: "users.dbml", title: "People" },
  ],
};

const SCHEMAS: Record<string, string> = {
  "/schemas/billing/invoices.dbml":
    "Table invoices {\n  id integer [pk]\n  total integer\n}\n",
  "/schemas/users.dbml": "Table catalogue_users {\n  id integer [pk]\n}\n",
};

// One route for the whole prefix rather than one per shape of URL: two
// overlapping globs would depend on the order Playwright matches them in, which
// is not the order they are written in.
const serveCatalogue = async (page: Page): Promise<void> => {
  await page.route("**/schemas/**", async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === "/schemas/index.json") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MANIFEST),
      });
      return;
    }

    const body = SCHEMAS[path];

    await (body === undefined
      ? route.fulfill({ status: 404, body: "not found" })
      : route.fulfill({ status: 200, contentType: "text/plain", body }));
  });
};

const rowFor = (page: Page, name: string): Locator =>
  page.getByRole("button", { name, exact: true });

const openMenu = async (page: Page, name: string): Promise<void> => {
  await rowFor(page, name).hover();
  await page.getByRole("button", { name: `Actions: ${name}` }).click();
};

test("a deployment with a catalogue opens its schemas from the tree", async ({
  page,
}) => {
  await serveCatalogue(page);
  await page.goto("/");

  const editor = page.locator(".monaco-editor");
  await expect(editor).toBeVisible();

  // The catalogue's default file, and no tab bar anywhere: the tree is the
  // whole of the navigation now.
  await expect(editor).toContainText("invoices");
  await expect(page.getByRole("tab")).toHaveCount(0);

  // Named from the manifest, not from the file name.
  await expect(rowFor(page, "Invoices")).toBeVisible();

  await rowFor(page, "People").click();
  await expect(editor).toContainText("catalogue_users");
});

test("a reader's own version of a project file is kept, and can be given back", async ({
  page,
}) => {
  await serveCatalogue(page);
  await page.goto("/");

  const editor = page.locator(".monaco-editor");
  await expect(editor).toContainText("invoices");

  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Table mine {\n  id integer [pk]\n}\n");

  // How a reader tells their version from the image's. Asserted on the row's
  // description rather than on the dot itself: the dot is decoration, and the
  // row must keep its name while its state changes.
  await expect(rowFor(page, "Invoices")).toHaveAccessibleDescription(
    /your own version/,
  );

  // It survives being navigated away from and back: the version lives in the
  // browser, not in whatever the editor happens to be showing.
  await rowFor(page, "People").click();
  await expect(editor).toContainText("catalogue_users");
  await rowFor(page, "Invoices").click();
  await expect(editor).toContainText("mine");

  await openMenu(page, "Invoices");
  await page
    .getByRole("menuitem", { name: "Restore the project's version" })
    .click();

  await expect(editor).toContainText("invoices");
  await expect(editor).not.toContainText("mine");
  await expect(rowFor(page, "Invoices")).not.toHaveAccessibleDescription(
    /your own version/,
  );
});

test("a file the reader opens joins their own section, and can be removed", async ({
  page,
}) => {
  await serveCatalogue(page);
  await page.goto("/");

  await page.setInputFiles('input[type="file"]', {
    name: "dropped.dbml",
    mimeType: "text/plain",
    buffer: Buffer.from("Table dropped_here {\n  id integer [pk]\n}\n"),
  });

  const editor = page.locator(".monaco-editor");
  await expect(editor).toContainText("dropped_here");
  await expect(rowFor(page, "dropped.dbml")).toBeVisible();

  await openMenu(page, "dropped.dbml");
  await page.getByRole("menuitem", { name: "Remove from my files" }).click();

  await expect(rowFor(page, "dropped.dbml")).toHaveCount(0);
});

test("a project file can be taken away without opening it first", async ({
  page,
}) => {
  await serveCatalogue(page);
  await page.goto("/");

  // `People` has never been selected, so nothing has fetched it. The row still
  // promises a download, and a promise that hands over an empty file is worse
  // than no promise at all.
  await openMenu(page, "People");
  // Named as a menu item, because the toolbar has a Download of its own.
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Download" }).click();

  const saved = await (await download).path();

  expect(readFileSync(saved, "utf8")).toContain("catalogue_users");
});

test("a schema that does not parse can still be taken away", async ({
  page,
}) => {
  await serveCatalogue(page);
  await page.goto("/");

  const editor = page.locator(".monaco-editor");
  await expect(editor).toContainText("invoices");

  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Table broken {");

  // No diagram means no toolbar, which is exactly when someone wants their text
  // out of the page. The row's menu is what makes that a promise rather than a
  // convenience.
  await expect(page.locator(".konvajs-content")).toHaveCount(0);

  await openMenu(page, "Invoices");
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Download" }).click();

  // The folder is kept in the name rather than dropped: two schemas called
  // `invoices.dbml` in different folders must not download over each other.
  expect((await download).suggestedFilename()).toBe("billing-invoices.dbml");
});
