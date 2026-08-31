import { interactionModeStore } from "../interactionModeStore";

import { InteractionMode } from "@/types/interactionMode";

describe("interactionModeStore", () => {
  afterEach(() => {
    interactionModeStore.setMode(InteractionMode.Pan);
  });

  it("starts in pan", () => {
    // A mode that survived a reload would be a mode the reader has forgotten
    // they are in, and the symptom is a canvas that will not pan for reasons
    // nothing on screen explains.
    expect(interactionModeStore.getMode()).toBe(InteractionMode.Pan);
  });

  it("goes to select and back", () => {
    interactionModeStore.toggleMode();
    expect(interactionModeStore.getMode()).toBe(InteractionMode.Select);

    interactionModeStore.toggleMode();
    expect(interactionModeStore.getMode()).toBe(InteractionMode.Pan);
  });

  it("tells subscribers, and stops when they leave", () => {
    const listener = jest.fn();
    const unsubscribe = interactionModeStore.subscribe(listener);

    interactionModeStore.toggleMode();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    interactionModeStore.toggleMode();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("says nothing when set to the mode it is already in", () => {
    const listener = jest.fn();
    const unsubscribe = interactionModeStore.subscribe(listener);

    interactionModeStore.setMode(InteractionMode.Pan);

    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
  });
});
