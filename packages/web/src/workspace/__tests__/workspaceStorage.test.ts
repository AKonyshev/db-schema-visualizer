import { readStoredWorkspace } from "../workspaceStorage";

// The suite runs under Node, where there is no `window` at all. Standing one up
// per test is also the only way to have `getItem` throw, which is what a
// browser configured to block site data actually does.
const withLocalStorage = (localStorage: unknown): void => {
  (globalThis as { window?: unknown }).window = { localStorage };
};

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("readStoredWorkspace", () => {
  test("hands over what was stored, unparsed", () => {
    withLocalStorage({ getItem: () => '{"version":1}' });

    expect(readStoredWorkspace()).toEqual({
      kind: "found",
      raw: '{"version":1}',
    });
  });

  test("says so when nothing has been stored", () => {
    withLocalStorage({ getItem: () => null });

    expect(readStoredWorkspace()).toEqual({ kind: "empty" });
  });

  // Safari's private mode and a browser told to block site data both raise on
  // access. That is not the same as having nothing stored, and the caller
  // treats it differently: there may be a workspace behind the refusal, so its
  // documents are not anyone's to throw away.
  test("says so when the browser refuses to be read from", () => {
    withLocalStorage({
      getItem: () => {
        throw new Error("The operation is insecure.");
      },
    });

    expect(readStoredWorkspace()).toEqual({ kind: "unreadable" });
  });
});
