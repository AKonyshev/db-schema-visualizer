/**
 * What the frame and the documentation page around it say to each other.
 *
 * The frame is an `<iframe>` in a page it does not control and cannot resize:
 * a diagram that wants the whole viewport has to ask for it. This module is
 * the vocabulary of that request — no `window`, no listeners, nothing that
 * needs a browser to test.
 *
 * The other half lives in the site of documentation, in
 * `antora/docs/lib/dbml-frame-host.js`, and is written out again there rather
 * than imported: the two are different projects in different repositories, and
 * a shared package for four message shapes would cost more than it saves. The
 * price is that this file and that one have to be changed together, which is
 * why both name the other in a comment.
 */

/** Marks a message as belonging to this protocol and not to some other frame's. */
export const FRAME_PROTOCOL = "dbml-frame";

interface FrameHello {
  source: typeof FRAME_PROTOCOL;
  type: "hello";
}

interface FrameExpand {
  source: typeof FRAME_PROTOCOL;
  type: "expand";
  expanded: boolean;
}

/** Frame to host. */
export type FrameMessage = FrameHello | FrameExpand;

interface HostReady {
  source: typeof FRAME_PROTOCOL;
  type: "ready";
}

interface HostExpanded {
  source: typeof FRAME_PROTOCOL;
  type: "expanded";
  expanded: boolean;
}

/** Host to frame. */
export type HostMessage = HostReady | HostExpanded;

/**
 * "There is a frame here that can be expanded."
 *
 * Sent once, on mount. A host that answers gets a button; one that stays quiet
 * — an older build of the site, or the frame opened straight from the address
 * bar — gets none, because a button that visibly does nothing is worse than an
 * absent one.
 */
export const helloMessage = (): FrameHello => ({
  source: FRAME_PROTOCOL,
  type: "hello",
});

/** "Put me across the page", or "put me back". */
export const expandMessage = (expanded: boolean): FrameExpand => ({
  source: FRAME_PROTOCOL,
  type: "expand",
  expanded,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * One message from the host, or `null` for anything else on the wire.
 *
 * `null` covers a lot of ordinary traffic: a page carries whatever its other
 * scripts post, and in development the dev server's own messages arrive here
 * too. Only the two shapes below are answered.
 */
export const parseHostMessage = (data: unknown): HostMessage | null => {
  if (!isRecord(data) || data.source !== FRAME_PROTOCOL) {
    return null;
  }

  if (data.type === "ready") {
    return { source: FRAME_PROTOCOL, type: "ready" };
  }

  if (data.type === "expanded" && typeof data.expanded === "boolean") {
    return {
      source: FRAME_PROTOCOL,
      type: "expanded",
      expanded: data.expanded,
    };
  }

  return null;
};
