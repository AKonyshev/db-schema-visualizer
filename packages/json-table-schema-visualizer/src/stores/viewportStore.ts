export interface Viewport {
  /** Stage scale. */
  scale: number;
  /** Stage offset, in screen pixels. */
  x: number;
  y: number;
  /** Stage size, in screen pixels. */
  width: number;
  height: number;
}

type Listener = () => void;

const EMPTY: Viewport = { scale: 1, x: 0, y: 0, width: 0, height: 0 };

/**
 * Where the reader is looking, outside React.
 *
 * The stage is panned and zoomed by writing to Konva directly — no React state
 * is involved, which is what keeps a drag at canvas speed. Nothing else could
 * then know the view had moved, so this is where that fact is published, and
 * the few things that care (which tables are worth mounting, whether text is
 * large enough to read) subscribe to it.
 */
class ViewportStore {
  private viewport: Viewport = EMPTY;
  private readonly listeners = new Set<Listener>();

  public readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  public readonly get = (): Viewport => this.viewport;

  public readonly set = (next: Viewport): void => {
    const current = this.viewport;
    if (
      next.scale === current.scale &&
      next.x === current.x &&
      next.y === current.y &&
      next.width === current.width &&
      next.height === current.height
    ) {
      return;
    }

    this.viewport = next;
    this.listeners.forEach((listener) => {
      listener();
    });
  };

  /** A new document starts with no view of its own. */
  public readonly reset = (): void => {
    this.viewport = EMPTY;
  };
}

export const viewportStore = new ViewportStore();

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The world-space rectangle the reader can see, grown by `margin` viewports on
 * every side so that panning reveals tables that are already mounted rather than
 * popping them in at the edge.
 */
export const visibleWorldRect = (
  viewport: Viewport,
  margin: number,
): Rect | null => {
  if (viewport.width <= 0 || viewport.height <= 0 || viewport.scale <= 0) {
    return null;
  }

  const w = viewport.width / viewport.scale;
  const h = viewport.height / viewport.scale;

  return {
    x: -viewport.x / viewport.scale - w * margin,
    y: -viewport.y / viewport.scale - h * margin,
    w: w * (1 + margin * 2),
    h: h * (1 + margin * 2),
  };
};

export const rectsIntersect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
