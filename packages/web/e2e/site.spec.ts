import { expect, test, type Request } from "@playwright/test";

// A relative path rather than the package name the rest of this package uses:
// Playwright's loader resolves the workspace symlink but will not add the `.ts`
// extension across it, and this file is compiled by Playwright rather than Vite.
import { MESSAGES_EN } from "../../json-table-schema-visualizer/src/i18n/messages";

// Everything the page is allowed to talk to. `blob:` and `data:` are the site
// handing bytes to itself — the download path builds a blob URL on purpose —
// and neither leaves the machine.
//
// Compared as an origin rather than as a string prefix: the port is assigned
// per run, and `http://127.0.0.1:4173` is a prefix of `http://127.0.0.1:41730`,
// so a prefix test would wave through a request to a different server on this
// very machine — the closest thing to a leak the test can see.
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
