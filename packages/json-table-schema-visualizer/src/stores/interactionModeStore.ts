import {
  DEFAULT_INTERACTION_MODE,
  InteractionMode,
} from "@/types/interactionMode";

type Listener = () => void;

/**
 * Pan or select, outside React.
 *
 * Read by the toolbar button, by the stage that has to decide what a drag
 * means, and by every table that has to decide what a click means — which is
 * why it is a store rather than state in `DiagramWrapper`.
 *
 * Deliberately not persisted. A mode that survives a reload is a mode the
 * reader has forgotten they are in, and the symptom is a canvas that will not
 * pan for reasons nothing on screen explains.
 */
class InteractionModeStore {
  private mode: InteractionMode = DEFAULT_INTERACTION_MODE;
  private readonly listeners = new Set<Listener>();

  public readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  public readonly getMode = (): InteractionMode => this.mode;

  public readonly setMode = (mode: InteractionMode): void => {
    if (mode === this.mode) {
      return;
    }

    this.mode = mode;
    this.listeners.forEach((listener) => {
      listener();
    });
  };

  public readonly toggleMode = (): void => {
    this.setMode(
      this.mode === InteractionMode.Select
        ? InteractionMode.Pan
        : InteractionMode.Select,
    );
  };
}

export const interactionModeStore = new InteractionModeStore();

/** Stable across renders, so the toolbar button never re-renders for it. */
export const toggleInteractionMode = interactionModeStore.toggleMode;
