import type { PropsWithChildren } from "react";

// Sized to its container, not to the viewport. `w-screen h-screen` amounted to
// the same thing while the only host was a full-window webview, but the site
// puts this in one half of a split: a viewport-wide box there begins at the
// pane's left edge and runs off the screen, taking the message with it.
const MessageWrapper = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      {/* These screens render before the theme provider — DiagramApp returns
          them ahead of it — so nothing sets a colour and the browser default of
          black applied, which on the dark canvas measured as unreadable. A mid
          grey is legible against either theme without needing to know which one
          is active.

          Long parser diagnostics arrive as a single line, hence the wrapping. */}
      <div className="max-w-prose whitespace-pre-wrap break-words text-center text-neutral-400">
        {children}
      </div>
    </div>
  );
};

export default MessageWrapper;
