import { expect, type Locator, type Page } from "@playwright/test";

// A relative path rather than the package name the rest of this package uses:
// Playwright's loader resolves the workspace symlink but will not add the `.ts`
// extension across it, and these files are compiled by Playwright rather than
// by Vite.
import { SELECTED_OUTLINE_NAME } from "../../json-table-schema-visualizer/src/constants/selection";
import { DIAGRAM_PADDING } from "../../json-table-schema-visualizer/src/constants/sizing";

/**
 * Reading the diagram from outside it.
 *
 * A canvas has no DOM to query, so every question about what is drawn goes
 * through `window.Konva` — Konva's own global, not a handle the application
 * adds for testing. Shared by both spec files because they ask the same
 * questions of the same canvas.
 */

export const canvasOf = (page: Page): Locator =>
  page.locator(".konvajs-content canvas").first();

/** Where each table sits, in the diagram's own coordinates. */
export const tablePositions = async (
  page: Page,
): Promise<Record<string, { x: number; y: number }>> =>
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

/**
 * How many tables are drawn as selected.
 *
 * By the node's name rather than by how it is drawn: a count built on stroke
 * width matches the hidden-relations outline and the search highlight too, and
 * answers the same number whatever is selected — which is an assertion that
 * passes for ever.
 */
export const selectedTableCount = async (page: Page): Promise<number> =>
  await page.evaluate(
    (name) => window.Konva?.stages[0]?.find(`.${name}`).length ?? 0,
    SELECTED_OUTLINE_NAME,
  );

export const stageIsDraggable = async (page: Page): Promise<boolean> =>
  await page.evaluate(() => window.Konva?.stages[0]?.draggable() ?? false);

/**
 * A screen point inside one table's header, to take hold of it by.
 *
 * The canvas has one bounding box however many tables are on it, so the point
 * has to be computed: table coordinates sit inside a Group offset by the
 * diagram padding, and the stage's transform turns the result into pixels.
 */
export const pointOnTable = async (
  page: Page,
  tableName: string,
): Promise<{ x: number; y: number }> => {
  const box = await canvasOf(page).boundingBox();
  const table = await page.evaluate((name) => {
    const groups = (window.Konva?.stages[0]?.find("Group") ?? []) as Array<{
      name: () => string;
      x: () => number;
      y: () => number;
    }>;
    const found = groups.find((group) => group.name() === name);
    const stage = window.Konva?.stages[0];

    return {
      x: found?.x() ?? 0,
      y: found?.y() ?? 0,
      scale: stage?.scaleX() ?? 1,
      stageX: stage?.x() ?? 0,
      stageY: stage?.y() ?? 0,
    };
  }, tableName);

  return {
    x:
      (box?.x ?? 0) +
      (table.x + DIAGRAM_PADDING) * table.scale +
      table.stageX +
      30,
    y:
      (box?.y ?? 0) +
      (table.y + DIAGRAM_PADDING) * table.scale +
      table.stageY +
      15,
  };
};

/**
 * Opens the site in select mode with every table caught by a marquee.
 *
 * The click first is not ceremony: the page opens with the editor holding the
 * focus, and a shortcut is ignored while a text field has it.
 */
export const selectEverything = async (page: Page): Promise<void> => {
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
