import {
  expect,
  test,
  type Locator,
  type Page,
  type Request,
} from "@playwright/test";

// A relative path rather than the package name the rest of this package uses:
// Playwright's loader resolves the workspace symlink but will not add the `.ts`
// extension across it, and this file is compiled by Playwright rather than Vite.
import { MESSAGES_EN } from "../../json-table-schema-visualizer/src/i18n/messages";
import { SELECTED_OUTLINE_NAME } from "../../json-table-schema-visualizer/src/constants/selection";

// Everything the page is allowed to talk to. `blob:` and `data:` are the site
// handing bytes to itself — the download path builds a blob URL on purpose —
// and neither leaves the machine.
//
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

/**
 * How many tables are drawn as selected.
 *
 * Counted off the canvas, because a canvas has no DOM to query and the
 * selection store is not on `window`. By the node's name rather than by how it
 * is drawn: a count built on stroke width matches the hidden-relations outline
 * and the search highlight too, and answers the same number whatever is
 * selected — which is an assertion that passes for ever.
 */
const selectedTableCount = async (page: Page): Promise<number> =>
  await page.evaluate(
    (name) => window.Konva?.stages[0]?.find(`.${name}`).length ?? 0,
    SELECTED_OUTLINE_NAME,
  );

const stageIsDraggable = async (page: Page): Promise<boolean> =>
  await page.evaluate(() => window.Konva?.stages[0]?.draggable() ?? false);

/** The diagram canvas, and a point on it that no table covers. */
const canvasOf = (page: Page): Locator =>
  page.locator(".konvajs-content canvas").first();

/**
 * Opens the site in select mode with every table caught by a marquee.
 *
 * The click first is not ceremony: the page opens with the editor holding the
 * focus, and a shortcut is ignored while a text field has it.
 */
const selectEverything = async (page: Page): Promise<void> => {
  await page.goto("/");
  await expect(canvasOf(page)).toBeVisible();

  const box = await canvasOf(page).boundingBox();
  const left = box?.x ?? 0;
  const top = box?.y ?? 0;
  const right = left + (box?.width ?? 0);
  const bottom = top + (box?.height ?? 0);

  await page.mouse.click(right - 20, bottom - 20);
  await page.keyboard.press("v");

  await page.mouse.move(left + 2, top + 2);
  await page.mouse.down();
  await page.mouse.move(right - 2, bottom - 2, { steps: 10 });
  await page.mouse.up();
};

test("the built site works, and asks the network for nothing", async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL ?? "").origin;
  const offOrigin: string[] = [];

  // Recorded rather than blocked. Blocking would prove the page survives without
  // the CDN; recording proves it never wanted it — which is the claim the site
  // actually makes, and the one an operator on a closed network is relying on.
  page.on("request", (request) => {
    if (!isSameOrigin(request, origin)) {
      offOrigin.push(request.url());
    }
  });

  await page.goto("/");

  // The editor, not a container that would exist whether or not it loaded. This
  // element is created by Monaco itself, so its absence is exactly the failure
  // this test exists for: a build that expects to fetch the editor at run time.
  const editor = page.locator(".monaco-editor");
  await expect(editor).toBeVisible();

  // The diagram is drawn to a canvas, so there is no text in it to assert on.
  // What can be asserted is that the canvas exists and the layout gave it a real
  // box rather than collapsing it to nothing.
  const canvas = page.locator(".konvajs-content canvas").first();
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(100);
  expect(box?.height ?? 0).toBeGreaterThan(100);

  const beforeTyping = await canvas.screenshot();

  // Typed through the real editor rather than into the React state behind it.
  // This is the seam between the two halves of the page, and it is the seam that
  // is broken when the editor is not really there.
  // Typed in full, closing brace included: no language configuration is
  // registered for DBML, so the editor closes nothing on the reader's behalf and
  // a half-written schema stays a parse error — which unmounts the canvas and
  // shows a message instead, and would leave the assertions below waiting on an
  // element that is no longer there.
  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Table smoke_test {\n  id integer [pk]\n}\n");

  await expect(editor).toContainText("smoke_test");

  // Two independent readings of "the typed schema reached the diagram", because
  // neither is enough on its own: the repainted canvas proves something was
  // drawn, and the search list proves what was drawn is a table by that name.
  //
  // The canvas first, and by polling: parsing is debounced, so asking either
  // question the instant the last character lands asks it of the previous
  // schema.
  await expect
    .poll(async () => Buffer.compare(await canvas.screenshot(), beforeTyping), {
      timeout: 10_000,
    })
    .not.toBe(0);

  // The label comes from the catalogue rather than being spelled out here, so a
  // renamed placeholder fails this test instead of silently making it match
  // nothing. The locale is pinned to English in the config, which is what lets
  // the English catalogue be the right one to read.
  await page
    .getByRole("textbox", { name: MESSAGES_EN["search.placeholder"] })
    .fill("smoke");
  await expect(page.getByRole("button", { name: /smoke_test/ })).toBeVisible();

  expect(offOrigin).toEqual([]);
});

test("a marquee selects several tables and drags them together", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.locator(".konvajs-content canvas").first();
  await expect(canvas).toBeVisible();

  const positions = async (): Promise<
    Record<string, { x: number; y: number }>
  > =>
    await page.evaluate(() => {
      const groups = (window.Konva?.stages[0]?.find("Group") ?? []) as Array<{
        name: () => string;
        x: () => number;
        y: () => number;
      }>;

      return Object.fromEntries(
        groups
          .filter((group) => String(group.name()).startsWith("table-"))
          .map((group) => [group.name(), { x: group.x(), y: group.y() }]),
      );
    });

  const before = await positions();
  const names = Object.keys(before);
  expect(names.length).toBeGreaterThan(1);

  const box = await canvas.boundingBox();
  const left = box?.x ?? 0;
  const top = box?.y ?? 0;
  const right = left + (box?.width ?? 0);
  const bottom = top + (box?.height ?? 0);

  // Into the canvas first: the shortcut is ignored while a text field has the
  // focus, and the page opens with the editor holding it.
  await page.mouse.click(right - 20, bottom - 20);
  await page.keyboard.press("v");

  // A marquee over the whole canvas catches every table.
  await page.mouse.move(left + 2, top + 2);
  await page.mouse.down();
  await page.mouse.move(right - 2, bottom - 2, { steps: 10 });
  await page.mouse.up();

  // Take hold of one table by its header. `boundingBox` is the canvas, so the
  // point has to be computed: table coordinates sit inside a Group offset by
  // the diagram padding, and the stage transform turns the result into pixels.
  const stage = await page.evaluate(() => {
    const konvaStage = window.Konva?.stages[0] as unknown as {
      scaleX: () => number;
      x: () => number;
      y: () => number;
    };

    return {
      scale: konvaStage.scaleX(),
      x: konvaStage.x(),
      y: konvaStage.y(),
    };
  });

  const first = before[names[0]];
  const DIAGRAM_PADDING = 60;
  const screenX =
    left + (first.x + DIAGRAM_PADDING) * stage.scale + stage.x + 30;
  const screenY =
    top + (first.y + DIAGRAM_PADDING) * stage.scale + stage.y + 15;

  await page.mouse.move(screenX, screenY);
  await page.mouse.down();
  await page.mouse.move(screenX + 80, screenY + 40, { steps: 10 });
  await page.mouse.up();

  const after = await positions();

  const deltas = names.map((name) => ({
    x: after[name].x - before[name].x,
    y: after[name].y - before[name].y,
  }));

  // Something moved, and every table moved by the same amount: that is what
  // makes it a group move rather than one table being dragged.
  expect(Math.abs(deltas[0].x) + Math.abs(deltas[0].y)).toBeGreaterThan(0);

  for (const delta of deltas) {
    expect(delta.x).toBeCloseTo(deltas[0].x, 1);
    expect(delta.y).toBeCloseTo(deltas[0].y, 1);
  }
});

test("a middle-button pan that ends off the canvas leaves select mode intact", async ({
  page,
}) => {
  await selectEverything(page);
  expect(await selectedTableCount(page)).toBeGreaterThan(1);

  const box = await canvasOf(page).boundingBox();
  const left = box?.x ?? 0;
  const top = box?.y ?? 0;

  // Panning by the middle button makes the stage draggable for the length of
  // the gesture. Releasing outside the canvas sends the stage no mouse-up at
  // all, so nothing but a handler on the way out puts it back — and without one
  // select mode silently became pan mode, with the next drag both drawing a
  // marquee and moving the canvas.
  await page.mouse.move(left + 200, top + 200);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(left + 260, top + 240, { steps: 5 });
  await page.mouse.move(left - 80, top + 240, { steps: 5 });
  await page.mouse.up({ button: "middle" });

  await expect.poll(async () => await stageIsDraggable(page)).toBe(false);
  // And the gesture took nothing away with it.
  expect(await selectedTableCount(page)).toBeGreaterThan(1);
});

test("holding space pans without drawing a marquee or losing the selection", async ({
  page,
}) => {
  await selectEverything(page);
  const selected = await selectedTableCount(page);

  await page.keyboard.down("Space");
  await expect.poll(async () => await stageIsDraggable(page)).toBe(true);

  await page.keyboard.up("Space");
  await expect.poll(async () => await stageIsDraggable(page)).toBe(false);

  expect(await selectedTableCount(page)).toBe(selected);
});

test("Escape drops the selection, and so does leaving the mode", async ({
  page,
}) => {
  await selectEverything(page);
  expect(await selectedTableCount(page)).toBeGreaterThan(1);

  await page.keyboard.press("Escape");
  await expect.poll(async () => await selectedTableCount(page)).toBe(0);

  // And again, this time by going back to panning: a selection that outlived
  // the mode would silently change what a plain drag does.
  await selectEverything(page);
  expect(await selectedTableCount(page)).toBeGreaterThan(1);

  await page.keyboard.press("v");
  await expect.poll(async () => await selectedTableCount(page)).toBe(0);
});

test("shift adds one table to the selection and takes it away again", async ({
  page,
}) => {
  await selectEverything(page);
  const all = await selectedTableCount(page);
  expect(all).toBeGreaterThan(1);

  const first = await page.evaluate(() => {
    const groups = (window.Konva?.stages[0]?.find("Group") ?? []) as Array<{
      name: () => string;
      x: () => number;
      y: () => number;
    }>;
    const table = groups.find((group) =>
      String(group.name()).startsWith("table-"),
    );
    const stage = window.Konva?.stages[0];

    return {
      x: table?.x() ?? 0,
      y: table?.y() ?? 0,
      scale: stage?.scaleX() ?? 1,
      stageX: stage?.x() ?? 0,
      stageY: stage?.y() ?? 0,
    };
  });

  const box = await canvasOf(page).boundingBox();
  // Table coordinates sit inside a Group offset by the diagram padding, and the
  // stage transform turns the result into pixels. The offsets land the pointer
  // inside the table's header.
  const DIAGRAM_PADDING = 60;
  const x =
    (box?.x ?? 0) +
    (first.x + DIAGRAM_PADDING) * first.scale +
    first.stageX +
    30;
  const y =
    (box?.y ?? 0) +
    (first.y + DIAGRAM_PADDING) * first.scale +
    first.stageY +
    15;

  // A plain click narrows the selection to the one table under it.
  await page.mouse.click(x, y);
  await expect.poll(async () => await selectedTableCount(page)).toBe(1);

  // Shift takes that one back out, leaving nothing selected.
  await page.keyboard.down("Shift");
  await page.mouse.click(x, y);
  await page.keyboard.up("Shift");

  await expect.poll(async () => await selectedTableCount(page)).toBe(0);
});
