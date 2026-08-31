/**
 * What a drag on the canvas does.
 *
 * `Pan` is what the diagram has always done and stays the default: the reader
 * of a documentation page wants to move the view, not to rearrange a model.
 * `Select` is the mode in which a drag draws a marquee instead.
 */
export enum InteractionMode {
  Pan = "pan",
  Select = "select",
}

export const DEFAULT_INTERACTION_MODE = InteractionMode.Pan;
