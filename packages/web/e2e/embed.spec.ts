import {
  expect,
  test,
  type Locator,
  type Page,
  type Request,
} from "@playwright/test";

// Three tables and two relations, so that a filter naming two of them has
// something to leave out — both a table and the edge that reached it.
const ACL = `
Table "acl"."analysis" {
  id integer [pk]
  note varchar
}

Table "acl"."analysis_liquid" {
  id integer [pk]
  analysis_id integer
}

Table "acl"."gas_dynamic_research" {
  id integer [pk]
  analysis_id integer
}

Ref: "acl"."analysis"."id" < "acl"."analysis_liquid"."analysis_id"
Ref: "acl"."analysis"."id" < "acl"."gas_dynamic_research"."analysis_id"
`;

// The built site has no catalogue in it — nginx is what puts one at these paths
// in the container. Same-origin, so fulfilling them here keeps the promise the
// smoke test checks: nothing the page asks for leaves the origin.
const serveModel = async (page: Page): Promise<void> => {
  await page.route("**/schemas/**", async (route) => {
    const path = new URL(route.request().url()).pathname;

    await (path === "/schemas/acl.dbml"
      ? route.fulfill({ status: 200, contentType: "text/plain", body: ACL })
      : route.fulfill({ status: 404, body: "not found" }));
  });
};

const isSameOrigin = (request: Request, origin: string): boolean => {
  const url = request.url();

  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return true;
  }

  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
};

const canvasOf = (page: Page): Locator =>
  page.locator(".konvajs-content canvas").first();

test("the frame draws the model named in its query, and asks for nothing else", async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL ?? "").origin;
  const offOrigin: string[] = [];
  const schemaRequests: string[] = [];

  page.on("request", (request) => {
    if (!isSameOrigin(request, origin)) {
      offOrigin.push(request.url());
    }

    const path = new URL(request.url()).pathname;

    if (path.startsWith("/schemas/")) {
      schemaRequests.push(path);
    }
  });

  await serveModel(page);
  await page.goto("/embed.html?src=acl.dbml");

  const canvas = canvasOf(page);
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(0);
  expect(box?.height ?? 0).toBeGreaterThan(0);

  expect(offOrigin).toEqual([]);
  // One file, and only the one the query named: no manifest, no second model.
  // The frame is not the catalogue and must not go looking for one.
  expect(schemaRequests).toEqual(["/schemas/acl.dbml"]);
});

test("the filter reaches the drawing", async ({ page }) => {
  await serveModel(page);

  await page.goto("/embed.html?src=acl.dbml");
  await expect(canvasOf(page)).toBeVisible();
  const whole = await canvasOf(page).screenshot();

  await page.goto("/embed.html?src=acl.dbml&tables=analysis,analysis_liquid");
  await expect(canvasOf(page)).toBeVisible();
  const filtered = await canvasOf(page).screenshot();

  // Not an assertion about which tables are on the canvas — the canvas has no
  // text in it to read, and `filterSchema`'s unit tests say which tables
  // survive. This says the parameter was not quietly ignored.
  expect(Buffer.compare(whole, filtered)).not.toBe(0);
});

test("a name that is in no table is said out loud", async ({ page }) => {
  await serveModel(page);
  await page.goto("/embed.html?src=acl.dbml&tables=analisys");

  await expect(page.getByText("Table not found: analisys")).toBeVisible();
  await expect(page.locator(".konvajs-content")).toHaveCount(0);
});

test("a model that is not there is said out loud", async ({ page }) => {
  await serveModel(page);
  await page.goto("/embed.html?src=nothing.dbml");

  await expect(page.getByText("Schema not found: nothing.dbml")).toBeVisible();
});

test("the frame leaves no trace in storage", async ({ page }) => {
  await serveModel(page);

  await page.goto("/embed.html?src=acl.dbml");
  await page.evaluate(() => {
    window.localStorage.setItem("web:theme", "dark");
  });

  await page.goto("/embed.html?src=acl.dbml&tables=analysis,analysis_liquid");
  await expect(canvasOf(page)).toBeVisible();

  const state = await page.evaluate(() => ({
    // Computing the layout is also what stores it, so the frame has to take it
    // back out. A key per frame per page would accumulate against a quota the
    // full application shares.
    ours: Object.keys(window.localStorage).filter((key) =>
      key.includes("embed:"),
    ),
    // And the theme is the reader's, not the page's: `web:theme` is one key for
    // this whole origin.
    theme: window.localStorage.getItem("web:theme"),
  }));

  expect(state.ours).toEqual([]);
  expect(state.theme).toBe("dark");
});
