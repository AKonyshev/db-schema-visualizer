import { useCallback, useEffect, useState } from "react";

import {
  expandMessage,
  helloMessage,
  parseHostMessage,
  type FrameMessage,
} from "./frameHost";

export interface HostExpand {
  /** Whether there is a page out there that answered. See `frameHost`. */
  supported: boolean;
  expanded: boolean;
  toggle: () => void;
}

/**
 * Posted to the page that embedded us, and only to a page on this origin.
 *
 * The site of documentation serves the frame from its own origin, so naming
 * that origin costs nothing there and means a frame embedded from somewhere
 * else never has its messages delivered — it simply never hears back, and so
 * never offers a button.
 */
const post = (message: FrameMessage): void => {
  window.parent.postMessage(message, window.location.origin);
};

/**
 * The frame's end of the expand-me conversation.
 *
 * The host is the one that knows how wide the page is and what to do about it;
 * this hook only asks. It also does not decide what the button shows: the state
 * it reports is the state the host said it had settled on, so a page that
 * collapses a frame for its own reasons — the reader pressed Escape outside the
 * frame, or scrolled, or opened another one — moves the icon with it.
 */
export const useHostExpand = (): HostExpand => {
  const [supported, setSupported] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Nothing above us: the frame was opened from the address bar rather than
    // embedded. Posting to `window.parent` would post to ourselves.
    if (window.parent === window) {
      return;
    }

    const onMessage = (event: MessageEvent): void => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent
      ) {
        return;
      }

      const message = parseHostMessage(event.data);

      if (message === null) {
        return;
      }

      if (message.type === "ready") {
        setSupported(true);
        return;
      }

      setExpanded(message.expanded);
    };

    window.addEventListener("message", onMessage);

    // No retry, because none is needed: the host installs its listener from a
    // script the page carries ahead of the first frame, and a frame's own
    // scripts cannot run before the element that loads them has been parsed.
    post(helloMessage());

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      // Read a turn later, once every listener on this event has had it: the
      // shortcuts legend and the export menu both close on Escape and say so by
      // preventing the default, and they mount after this hook does, so their
      // listeners run after ours. Asking now would always find `false` and one
      // Escape would both close the menu and put the page back.
      setTimeout(() => {
        if (!event.defaultPrevented) {
          post(expandMessage(false));
        }
      }, 0);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  const toggle = useCallback(() => {
    post(expandMessage(!expanded));
  }, [expanded]);

  return { supported, expanded, toggle };
};
