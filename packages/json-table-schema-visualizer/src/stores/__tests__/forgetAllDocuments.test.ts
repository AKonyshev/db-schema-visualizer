import { forgetAllDocuments } from "../forgetAllDocuments";

// The stores are singletons that reach for `localStorage` and `sessionStorage`
// the moment they are asked to do anything, and this suite runs under Node.
// Standing in for them keeps the test about which stores are forgotten, which
// is the only thing this module decides. Each one signs the register instead of
// clearing anything.
const mockCleared: string[] = [];
const mockRefusedBy: string[] = [];

const mockClearAll = (name: string): void => {
  if (mockRefusedBy.includes(name)) {
    throw new Error("The operation is insecure.");
  }

  mockCleared.push(name);
};

// Each factory returns an object rather than calling anything: `jest.mock` is
// hoisted above this file's own declarations, and a factory that reached for
// one while building its store would find it uninitialised.
jest.mock("../tableCoords", () => ({
  tableCoordsStore: {
    clearAll: (): void => {
      mockClearAll("tableCoords");
    },
  },
}));
jest.mock("../stagesState", () => ({
  stageStateStore: {
    clearAll: (): void => {
      mockClearAll("stageState");
    },
  },
}));
jest.mock("../detailLevelStore", () => ({
  detailLevelStore: {
    clearAll: (): void => {
      mockClearAll("detailLevel");
    },
  },
}));
jest.mock("../tableRelationsVisibilityStore", () => ({
  tableRelationsVisibilityStore: {
    clearAll: (): void => {
      mockClearAll("tableRelationsVisibility");
    },
  },
}));

describe("forgetAllDocuments", () => {
  beforeEach(() => {
    mockCleared.length = 0;
    mockRefusedBy.length = 0;
  });

  // One per store `switchDocument` points at, and the reason this module exists
  // rather than the call site clearing what it happens to remember: a
  // per-document store added there and forgotten here leaves its keys behind
  // for the next document to inherit.
  test("clears every per-document store", () => {
    forgetAllDocuments();

    expect([...mockCleared].sort()).toEqual([
      "detailLevel",
      "stageState",
      "tableCoords",
      "tableRelationsVisibility",
    ]);
  });

  // Called before the first render, from a browser that may refuse storage
  // outright. Letting that throw would turn the page the caller is salvaging
  // into a blank one.
  test("survives a storage that refuses access", () => {
    mockRefusedBy.push("tableCoords", "stageState", "detailLevel");

    expect(() => {
      forgetAllDocuments();
    }).not.toThrow();
  });

  // The four do not share a storage — `stageState` is in `sessionStorage`, the
  // rest in `localStorage` — so a browser can refuse one and serve the others.
  // A refusal must cost only its own store's keys.
  test("clears the rest when one storage refuses", () => {
    mockRefusedBy.push("tableCoords");

    forgetAllDocuments();

    expect([...mockCleared].sort()).toEqual([
      "detailLevel",
      "stageState",
      "tableRelationsVisibility",
    ]);
  });
});
