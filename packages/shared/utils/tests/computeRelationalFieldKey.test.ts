import { computeRelationalFieldKey } from "../computeRelationalFieldKey";

describe("computeRelationalFieldKey", () => {
  test("joins table and field with a dot", () => {
    expect(computeRelationalFieldKey("users", "id")).toBe("users.id");
  });

  test("produces keys that consumers can match by table prefix", () => {
    // The dot separator is a cross-package contract, not a formatting choice:
    // the diagram counts a table's fields with `key.startsWith(`${table}.`)`,
    // so a change of separator here would silently break that lookup.
    const key = computeRelationalFieldKey("orders", "user_id");

    expect(key.startsWith("orders.")).toBe(true);
    expect(key.startsWith("order.")).toBe(false);
  });

  test("keeps names verbatim, including dots inside a name", () => {
    // Schema identifiers are passed through untouched — no escaping, no casing.
    expect(computeRelationalFieldKey("public.users", "id")).toBe(
      "public.users.id",
    );
  });
});
