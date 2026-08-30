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

// One table tall enough that fitting it into a page-sized frame puts its rows
// below the size at which they would once have stopped being drawn. Two
// hundred-odd columns in the whole model, which is nothing to draw — that is
// the point.
const TALL = `
Table "tall"."reading" {
${Array.from({ length: 120 }, (_, i) => `  c${i} integer`).join("\n")}
}
`;

// A model that carries its own layout, as every model in a real project does
// once anyone has arranged one. The coordinates are the whole model's: three
// tables, thousands of units apart.
const ARRANGED = `
Table "arr"."left" {
  id integer [pk]
}

Table "arr"."middle" {
  id integer [pk]
  left_id integer
}

Table "arr"."right" {
  id integer [pk]
}

Ref: "arr"."left"."id" < "arr"."middle"."left_id"

/*MetaInfo
[{"name":"arr.left","x":0,"y":0},
{"name":"arr.middle","x":6000,"y":4000},
{"name":"arr.right","x":12000,"y":9000}]
MetaInfo*/
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
          : path === "/schemas/tall.dbml"
            ? TALL
            : path === "/schemas/arranged.dbml"
              ? ARRANGED
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
    Konva?: {
      stages: Array<{ scaleX: () => number; find: (s: string) => unknown[] }>;
    };
  }
}

const stageScale = async (page: Page): Promise<number> =>
  await page.evaluate(() => window.Konva?.stages[0]?.scaleX() ?? 0);

const drawnTextCount = async (page: Page): Promise<number> =>
  await page.evaluate(() => window.Konva?.stages[0]?.find("Text").length ?? 0);

/** How far apart the tables are, in diagram units rather than pixels. */
const tableSpan = async (page: Page): Promise<number> =>
  await page.evaluate(() => {
    const groups = (window.Konva?.stages[0]?.find("Group") ?? []) as Array<{
      name: () => string;
      x: () => number;
      y: () => number;
    }>;
    const tables = groups.filter((g) => String(g.name()).startsWith("table-"));

    if (tables.length === 0) {
      return 0;
    }

    const xs = tables.map((t) => t.x());
    const ys = tables.map((t) => t.y());

    return Math.max(
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys),
    );
  });

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
  // Four times is a floor, not the expected figure — the measured jump is
  // a little over five. It is that large because the tables are not the only
  // thing that shrinks: the arrangement is computed from their drawn height, so
  // the room left between them shrinks with them and the whole diagram is laid
  // out in a shape that suits a row of headers. Spacing headers as though every
  // column were still under them scores about two, which is what this floor is
  // set to rule out.
  await expect
    .poll(async () => await stageScale(page))
    .toBeGreaterThan(atFullDetail * 4);

  // And where it landed is a framing, by the same measure the arrival uses:
  // one that pressing fit-to-view cannot improve.
  const framed = await canvasOf(page).screenshot();
  await page.keyboard.press("f");
  await expect
    .poll(async () => Buffer.compare(await canvasOf(page).screenshot(), framed))
    .toBe(0);

  // Round the rest of the cycle, back to where it started, because one press is
  // not enough to catch the way this went wrong: the level that is drawn and
  // the level the arrangement is computed for are kept in two places, and while
  // they were updated one render apart the first press looked right and every
  // press after it arranged for the level before. Coming back to full detail is
  // exact — the arrangement is the stored one, recovered rather than recomputed
  // — so a cycle that ends anywhere but where it began has lost track of which
  // level it is arranging for.
  await page.keyboard.press("d");
  await page.keyboard.press("d");

  await expect.poll(async () => await stageScale(page)).toBe(atFullDetail);
});

test("a small schema draws its columns however far out it is fitted", async ({
  page,
}) => {
  await serveModel(page);
  await page.setViewportSize({ width: 900, height: 500 });
  await page.goto("/embed.html?src=tall.dbml");
  await expect(canvasOf(page)).toBeVisible();

  // To full detail. One table of a hundred and twenty columns opens with its
  // header alone, so two presses of `D` — headers, keys, all of it.
  const box = await canvasOf(page).boundingBox();
  await page.mouse.click(
    (box?.x ?? 0) + (box?.width ?? 0) / 2,
    (box?.y ?? 0) + (box?.height ?? 0) / 2,
  );
  await page.keyboard.press("d");
  await page.keyboard.press("d");

  // Fitted into a frame this size, a column row is a few pixels tall — under
  // the size at which drawing the rows stops paying for itself on a schema big
  // enough for that to matter.
  await expect.poll(async () => (await stageScale(page)) * 30).toBeLessThan(6);

  // Drawn all the same, because this schema is not big enough for that to
  // matter. Hiding them here saves nothing and leaves the reader looking at an
  // empty box in a frame they cannot zoom, which is the one thing the filter in
  // the query was for.
  await expect
    .poll(async () => await drawnTextCount(page))
    .toBeGreaterThan(100);
});

test("a filtered diagram is arranged as itself, not as part of the model", async ({
  page,
}) => {
  await serveModel(page);
  await page.setViewportSize({ width: 900, height: 500 });
  await page.goto("/embed.html?src=arranged.dbml&tables=left,middle");
  await expect(canvasOf(page)).toBeVisible();

  // The file puts these two six thousand units apart, because that is where
  // they sit in a diagram of the whole model. Two tables out of three is not
  // that diagram: kept, those coordinates frame the empty rectangle between
  // them and the page shows two specks in opposite corners.
  await expect.poll(async () => await tableSpan(page)).toBeLessThan(2000);
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
