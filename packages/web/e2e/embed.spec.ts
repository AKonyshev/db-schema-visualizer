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

// One table wide enough that its detail level decides the whole framing, and
// narrow enough to still open at full detail: fifty columns is fifteen hundred
// pixels of table, against forty-four with the headers alone. Kept apart from
// `ACL` so that the tests above go on describing an ordinary model.
const WIDE = `
Table "wide"."reading" {
${Array.from({ length: 50 }, (_, i) => `  c${i} integer`).join("\n")}
}

Table "wide"."note" {
  id integer [pk]
  reading_id integer
}

Ref: "wide"."reading"."c0" < "wide"."note"."reading_id"
`;

// The built site has no catalogue in it — nginx is what puts one at these paths
// in the container. Same-origin, so fulfilling them here keeps the promise the
// smoke test checks: nothing the page asks for leaves the origin.
const serveModel = async (page: Page): Promise<void> => {
  await page.route("**/schemas/**", async (route) => {
    const path = new URL(route.request().url()).pathname;

    const model =
      path === "/schemas/acl.dbml"
        ? ACL
        : path === "/schemas/wide.dbml"
          ? WIDE
          : null;

    await (model === null
      ? route.fulfill({ status: 404, body: "not found" })
      : route.fulfill({ status: 200, contentType: "text/plain", body: model }));
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

// Konva publishes its stages on `window.Konva`; nothing in the application puts
// them there. Reaching for them is what lets a test say how far the diagram is
// zoomed, which is not a thing a screenshot of a canvas can be asked.
declare global {
  interface Window {
    Konva?: { stages: Array<{ scaleX: () => number }> };
  }
}

const stageScale = async (page: Page): Promise<number> =>
  await page.evaluate(() => window.Konva?.stages[0]?.scaleX() ?? 0);

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

test("the diagram arrives already framed", async ({ page }) => {
  await serveModel(page);
  await page.goto("/embed.html?src=acl.dbml");
  await expect(canvasOf(page)).toBeVisible();

  const onArrival = await canvasOf(page).screenshot();

  // Pressing fit-to-view is the definition of framed, so a frame that arrives
  // framed is one the keypress cannot improve. Asserted this way round because
  // the canvas carries no text and no numbers to read: "unchanged by F" is the
  // one thing about the framing a browser can state exactly.
  await page.keyboard.press("f");

  await expect
    .poll(async () =>
      Buffer.compare(await canvasOf(page).screenshot(), onArrival),
    )
    .toBe(0);
});

test("a change of detail level re-frames the diagram", async ({ page }) => {
  await serveModel(page);

  // The shape these props exist for: a frame a few hundred pixels tall in a
  // page of prose. It matters to what is measured below and not only to
  // realism — on a desktop-shaped viewport this diagram is fitted by its width,
  // which no detail level changes, and the scale barely moves however right the
  // framing is.
  await page.setViewportSize({ width: 900, height: 500 });
  await page.goto("/embed.html?src=wide.dbml");
  await expect(canvasOf(page)).toBeVisible();

  const atFullDetail = await stageScale(page);

  // `D` shortens every table to its header — a fiftieth of what the tall one
  // was — so the framing that arrived with the page is now framing something
  // that is not there any more, and the reader is left looking at a smear in
  // the middle of an empty canvas until they think to press `F`.
  await page.keyboard.press("d");

  // Read as a scale rather than compared as an image, which is the one thing
  // about the framing a screenshot cannot state: shrinking the tables changes
  // the picture whether or not the view followed them, so "the picture
  // changed" is true in both worlds and says nothing. The number separates
  // them. `window.Konva` is Konva's own global, not a handle the app adds for
  // testing.
  //
  // Half again is a floor, not the expected figure — the measured jump is a
  // little under twofold. It is not larger because only the tables shrink: the
  // gaps between them were computed by the layout at full detail and stay that
  // size, so a diagram of two headers is still some seven hundred units tall
  // and the fit is still decided by its height. What the floor rules out is the
  // view not moving at all, which is what every way of getting this wrong looks
  // like.
  await expect
    .poll(async () => await stageScale(page))
    .toBeGreaterThan(atFullDetail * 1.5);

  // And where it landed is a framing, by the same measure the arrival uses:
  // one that pressing fit-to-view cannot improve.
  const framed = await canvasOf(page).screenshot();
  await page.keyboard.press("f");
  await expect
    .poll(async () => Buffer.compare(await canvasOf(page).screenshot(), framed))
    .toBe(0);
});

test("the toolbar stays out of the diagram until the reader reaches for it", async ({
  page,
}) => {
  await serveModel(page);
  await page.goto("/embed.html?src=acl.dbml");
  await expect(canvasOf(page)).toBeVisible();

  // A frame is as tall as the page's author made it, and a toolbar sitting on
  // top of a 500px one covers the bottom fifth of the diagram it came to show.
  const fit = page.getByRole("button", { name: "Fit to view" });
  await expect(fit).toBeHidden();

  // `mouse.move` rather than `hover()`: the canvas animates its relations, so
  // Playwright can wait forever for it to be "stable" enough to hover.
  const box = await canvasOf(page).boundingBox();
  await page.mouse.move(
    (box?.x ?? 0) + (box?.width ?? 0) / 2,
    (box?.y ?? 0) + (box?.height ?? 0) / 2,
  );

  await expect(fit).toBeVisible();
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
