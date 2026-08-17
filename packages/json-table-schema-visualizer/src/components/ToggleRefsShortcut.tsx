import { useEffect, useRef } from "react";

import { useTablesInfo } from "@/hooks/table";
import { matchesToggleRefsShortcut } from "@/utils/matchesToggleRefsShortcut";

export interface ToggleRefsShortcutProps {
  onToggle: (tableName: string) => void;
}

/**
 * Alt+H, on the table the pointer is over.
 *
 * Rendered through the viewer's `syncEffects` slot rather than from the page
 * around it, because that slot is inside the providers and this needs the one
 * thing only they know: which table is hovered. The web host uses this
 * listener; the extension uses this same component and calls toggle directly,
 * the way the site does. A workbench keybinding that matches while the
 * webview is focused steals the chord; posting `toggleTableRefs` to `window`
 * from inside a VS Code webview does not reach the React handler.
 *
 * It renders nothing. What it contributes is a window listener, and a component
 * is simply how a hook reaches a context it would otherwise be outside of.
 */
const ToggleRefsShortcut = ({ onToggle }: ToggleRefsShortcutProps): null => {
  const { hoveredTableName } = useTablesInfo();

  // Both through refs, so that hovering a table — which changes on every mouse
  // move across the diagram — does not detach and reattach the listener.
  const hoveredRef = useRef(hoveredTableName);
  hoveredRef.current = hoveredTableName;
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!matchesToggleRefsShortcut(event)) {
        return;
      }

      // preventDefault even when nothing is hovered: on a Mac the chord types
      // "˙" into the editor beside the diagram. The host decides whether an
      // empty name is a no-op or a single-table fallback.
      event.preventDefault();
      onToggleRef.current(hoveredRef.current ?? "");
    };

    // Capturing, because the editor has its own view on Alt-chords and holds
    // focus for most of the time anyone is looking at the diagram.
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return null;
};

export default ToggleRefsShortcut;
