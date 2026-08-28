import { expect, test, type Page } from "@playwright/test";

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

test("a deployment with a catalogue opens its schemas from the tree", async ({
  page,
}) => {
  await serveCatalogue(page);
  await page.goto("/");

  const editor = page.locator(".monaco-editor");
  await expect(editor).toBeVisible();

  // The catalogue's default file rather than the sample schema: this is what
  // somebody sees the moment the container is up.
  await expect(editor).toContainText("invoices");
  await expect(page.getByRole("tab", { name: "invoices.dbml" })).toBeVisible();

  // Named from the manifest, not from the file name.
  const people = page.getByRole("button", { name: "People", exact: true });
  await expect(people).toBeVisible();

  await people.click();

  await expect(editor).toContainText("catalogue_users");
  await expect(page.getByRole("tab", { name: "users.dbml" })).toHaveCount(1);

  // A second choice of the same file returns to its tab rather than opening
  // another one beside it.
  await people.click();
  await expect(page.getByRole("tab", { name: "users.dbml" })).toHaveCount(1);
});

test("the filter narrows the tree to what was typed", async ({ page }) => {
  await serveCatalogue(page);
  await page.goto("/");

  // Named, because the diagram has a search box of its own.
  await page.getByRole("searchbox", { name: "Filter files..." }).fill("peo");

  await expect(
    page.getByRole("button", { name: "People", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Invoices", exact: true }),
  ).toHaveCount(0);
});
