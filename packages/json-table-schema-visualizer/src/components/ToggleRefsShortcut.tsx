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
 * thing only they know: which table is hovered. The extension reads the same
 * value for the same command.
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

      const tableName = hoveredRef.current;
      // Nothing under the pointer is not an error, it is the ordinary case of
      // pressing the key while looking at empty canvas.
      if (tableName === null || tableName === "") {
        return;
      }

      // When a table is hovered, Alt+H toggles its refs even if the caret is
      // still in the DBML editor beside the diagram — the usual layout in the
      // web site and in VS Code. preventDefault keeps the editor from also
      // receiving the chord (for example "˙" on a Mac).
      event.preventDefault();
      onToggleRef.current(tableName);
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
