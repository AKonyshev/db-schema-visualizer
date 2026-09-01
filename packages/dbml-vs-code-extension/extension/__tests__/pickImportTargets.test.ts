jest.mock("db-to-dbml", () => {
  const actual = jest.requireActual(
    "db-to-dbml",
  ) as typeof import("db-to-dbml");
  return {
    ...actual,
    listDatabases: jest.fn(),
    listSchemas: jest.fn(),
  };
});

import { window } from "vscode";
import { listDatabases, listSchemas } from "db-to-dbml";

import { pickImportTargets } from "../pickImportTargets";

const CONNECTION = "postgres://u:p@h:5432/entry";

describe("pickImportTargets", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.mocked(listDatabases).mockReset();
    jest.mocked(listSchemas).mockReset();
    jest.mocked(window.showQuickPick).mockReset();
    jest.mocked(window.showWarningMessage).mockReset();
  });

  afterEach(() => {
    jest.mocked(console.error).mockRestore();
  });

  test("asks nothing when a schema node already answered everything", async () => {
    const targets = await pickImportTargets({
      connectionString: CONNECTION,
      databaseName: "orders",
      schemaName: "audit",
    });

    expect(targets).toEqual([
      { databaseName: "orders", schemaNames: ["audit"] },
    ]);
    expect(listDatabases).not.toHaveBeenCalled();
    expect(window.showQuickPick).not.toHaveBeenCalled();
  });

  test("asks nothing when the server has one database with one schema", async () => {
    jest.mocked(listDatabases).mockResolvedValue(["orders"]);
    jest.mocked(listSchemas).mockResolvedValue(["public"]);

    expect(await pickImportTargets({ connectionString: CONNECTION })).toEqual([
      { databaseName: "orders", schemaNames: ["public"] },
    ]);
    expect(window.showQuickPick).not.toHaveBeenCalled();
  });

  test("groups the schemas of several databases into one dialog", async () => {
    jest.mocked(listDatabases).mockResolvedValue(["billing", "orders"]);
    jest
      .mocked(listSchemas)
      .mockResolvedValueOnce(["public"])
      .mockResolvedValueOnce(["audit", "public"]);

    jest
      .mocked(window.showQuickPick)
      // The database step, then the schema step.
      .mockResolvedValueOnce(["billing", "orders"] as never)
      .mockImplementationOnce((async (items: unknown) => {
        const list = items as Array<{ label: string; databaseName?: string }>;
        // Everything the wizard offered, minus billing's public schema.
        return list.filter(
          (item) =>
            item.databaseName !== undefined &&
            !(item.databaseName === "billing" && item.label === "public"),
        );
      }) as never);

    const targets = await pickImportTargets({ connectionString: CONNECTION });

    expect(targets).toEqual([
      { databaseName: "orders", schemaNames: ["audit", "public"] },
    ]);

    // The schema dialog carried a separator per database and pre-picked
    // everything: unticking extras is faster than ticking a list.
    const schemaItems = jest.mocked(window.showQuickPick).mock
      .calls[1][0] as unknown as Array<{
      label: string;
      kind?: number;
      picked?: boolean;
      description?: string;
    }>;
    expect(
      schemaItems.filter((i) => i.kind === -1).map((i) => i.label),
    ).toEqual(["billing", "orders"]);
    expect(
      schemaItems.filter((i) => i.kind === undefined).every((i) => i.picked),
    ).toBe(true);
    // [separator billing, billing.public, separator orders, …]: the schema
    // right after a separator belongs to it, and says so in its description.
    expect(schemaItems[1]).toMatchObject({
      label: "public",
      description: "billing",
    });
  });

  test("returns undefined when the schema step is cancelled", async () => {
    jest.mocked(listDatabases).mockResolvedValue(["billing", "orders"]);
    jest.mocked(listSchemas).mockResolvedValue(["audit", "public"]);
    jest
      .mocked(window.showQuickPick)
      .mockResolvedValueOnce(["billing", "orders"] as never)
      .mockResolvedValueOnce(undefined);

    expect(
      await pickImportTargets({ connectionString: CONNECTION }),
    ).toBeUndefined();
  });

  test("reports a database whose schemas cannot be read and offers the rest", async () => {
    jest.mocked(listDatabases).mockResolvedValue(["billing", "orders"]);
    jest
      .mocked(listSchemas)
      .mockRejectedValueOnce(new Error("permission denied"))
      .mockResolvedValueOnce(["public"]);
    jest
      .mocked(window.showQuickPick)
      .mockResolvedValueOnce(["billing", "orders"] as never);

    const targets = await pickImportTargets({ connectionString: CONNECTION });

    expect(window.showWarningMessage).toHaveBeenCalledWith(
      "Could not read the schemas of: billing",
    );
    // One readable database with one schema left — no second dialog needed.
    expect(targets).toEqual([
      { databaseName: "orders", schemaNames: ["public"] },
    ]);
  });

  test("does not open a connection per database all at once", async () => {
    const many = Array.from({ length: 12 }, (_, index) => `db${index}`);
    jest.mocked(listDatabases).mockResolvedValue(many);

    let inFlight = 0;
    let peak = 0;
    jest.mocked(listSchemas).mockImplementation(async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 0));
      inFlight -= 1;
      return ["public"];
    });
    jest
      .mocked(window.showQuickPick)
      .mockResolvedValueOnce(many as never)
      // The schema step is beside the point here; cancelling it ends the run.
      .mockResolvedValueOnce(undefined);

    await pickImportTargets({ connectionString: CONNECTION });

    // Every database is still asked about — just not all at the same moment,
    // and not one at a time either: the whole point is a bounded overlap.
    expect(listSchemas).toHaveBeenCalledTimes(12);
    expect(peak).toBe(5);
  });

  test("does not blame empty schemas when every database was unreadable", async () => {
    jest.mocked(listDatabases).mockResolvedValue(["billing", "orders"]);
    jest.mocked(listSchemas).mockRejectedValue(new Error("permission denied"));
    jest
      .mocked(window.showQuickPick)
      .mockResolvedValueOnce(["billing", "orders"] as never);

    expect(
      await pickImportTargets({ connectionString: CONNECTION }),
    ).toBeUndefined();

    // The one warning above already named the cause; a second one about empty
    // schemas would name the wrong one.
    expect(window.showWarningMessage).toHaveBeenCalledTimes(1);
    expect(window.showWarningMessage).toHaveBeenCalledWith(
      "Could not read the schemas of: billing, orders",
    );
  });

  test("speaks of databases in the plural when several were chosen", async () => {
    jest.mocked(listDatabases).mockResolvedValue(["billing", "orders"]);
    jest.mocked(listSchemas).mockResolvedValue([]);
    jest
      .mocked(window.showQuickPick)
      .mockResolvedValueOnce(["billing", "orders"] as never);

    expect(
      await pickImportTargets({ connectionString: CONNECTION }),
    ).toBeUndefined();
    expect(window.showWarningMessage).toHaveBeenCalledWith(
      "No user schemas found in the selected databases.",
    );
  });

  test("warns and gives up when nothing has a user schema", async () => {
    jest.mocked(listDatabases).mockResolvedValue(["orders"]);
    jest.mocked(listSchemas).mockResolvedValue([]);

    expect(
      await pickImportTargets({ connectionString: CONNECTION }),
    ).toBeUndefined();
    expect(window.showWarningMessage).toHaveBeenCalledWith(
      "No user schemas found in this database.",
    );
  });
});
