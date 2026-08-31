import { selectionStore } from "../selectionStore";

describe("selectionStore", () => {
  beforeEach(() => {
    selectionStore.clear();
  });

  it("starts empty", () => {
    expect(selectionStore.getSelected().size).toBe(0);
  });

  it("holds what it was given and answers about one table", () => {
    selectionStore.setSelected(new Set(["a", "b"]));

    expect(selectionStore.isSelected("a")).toBe(true);
    expect(selectionStore.isSelected("c")).toBe(false);
  });

  it("tells subscribers when the set changes", () => {
    const listener = jest.fn();
    const unsubscribe = selectionStore.subscribe(listener);

    selectionStore.setSelected(new Set(["a"]));

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    selectionStore.setSelected(new Set(["a", "b"]));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("says nothing when the same set is set again", () => {
    // A marquee drag sets the selection on every pointer move, and most moves
    // land on the same tables. Re-rendering every table in the diagram for each
    // of those is the cost this guard exists to avoid.
    selectionStore.setSelected(new Set(["a", "b"]));

    const listener = jest.fn();
    const unsubscribe = selectionStore.subscribe(listener);

    selectionStore.setSelected(new Set(["b", "a"]));

    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
  });

  it("says nothing when clearing an already empty selection", () => {
    const listener = jest.fn();
    const unsubscribe = selectionStore.subscribe(listener);

    selectionStore.clear();

    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
  });

  it("toggles one table in and out", () => {
    selectionStore.setSelected(new Set(["a"]));

    selectionStore.toggle("b");
    expect([...selectionStore.getSelected()].sort()).toEqual(["a", "b"]);

    selectionStore.toggle("a");
    expect([...selectionStore.getSelected()]).toEqual(["b"]);

    selectionStore.toggle("b");
    expect(selectionStore.getSelected().size).toBe(0);
  });

  it("keeps the snapshot stable while the selection does not change", () => {
    // `useSyncExternalStore` compares snapshots by identity and throws on an
    // infinite render loop if a getter returns a new object every call.
    selectionStore.setSelected(new Set(["a"]));

    expect(selectionStore.getSelected()).toBe(selectionStore.getSelected());
  });
});
