/**
 * Konva publishes its stages on `window.Konva`; nothing in the application puts
 * them there. Reaching for them is what lets a test say how far the diagram is
 * zoomed, or where a table ended up — neither of which a screenshot of a canvas
 * can be asked.
 *
 * Declared once for the whole suite rather than in each spec that needs it: two
 * files declaring the same global with different shapes is a type error, and it
 * is the same window either way.
 */
export {};

declare global {
  interface Window {
    Konva?: {
      stages: Array<{
        scaleX: () => number;
        x: () => number;
        y: () => number;
        draggable: () => boolean;
        find: (s: string) => unknown[];
      }>;
    };
  }
}
