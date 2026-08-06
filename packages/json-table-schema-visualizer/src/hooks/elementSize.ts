import { useLayoutEffect, useState, type RefObject } from "react";

import { type Dimension } from "@/types/dimension";

// The diagram measures the box it was given, not the window.
//
// These were the same number for as long as the only host was a webview filling
// its window. They stop being the same the moment the diagram shares a page: a
// viewport-sized canvas laid over one half of a split extends across the other
// half, covering whatever is there and taking its clicks.
//
// The ResizeObserver is what does the work. A container can change size with no
// render of this component behind it — a dragged split divider changes a
// sibling's width, and React skips a subtree whose element is referentially
// unchanged — so a re-render is not a signal that can be relied on.
//
// The layout effect re-measures on every render as well. That is not the primary
// path and does not catch the divider; it is there so a render that *does* reach
// this component picks up a size the observer has not reported yet.
export const useElementSize = (ref: RefObject<HTMLElement>): Dimension => {
  const [size, setSize] = useState<Dimension>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) {
      return;
    }

    // Only set state on an actual change, or measuring after every render would
    // schedule a render after every measurement.
    const measure = (): void => {
      const { width, height } = element.getBoundingClientRect();
      setSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  });

  return size;
};
