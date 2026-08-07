import { useEffect, useRef } from "react";
import { useTablesInfo } from "json-table-schema-visualizer/src/hooks/table";

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
      if (!event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      // `code` first, because Alt+H reports `key` as "˙" on a Mac and as other
      // characters under other layouts — matching on `key` alone would leave the
      // shortcut working on some machines and silently missing on others.
      //
      // `key` is still accepted as well, and not only for the platforms where it
      // reads "h": an event synthesised by automation carries no `code` at all,
      // so a `code`-only test would make this the one command in the site that
      // cannot be exercised by anything but a human.
      if (event.code !== "KeyH" && event.key.toLowerCase() !== "h") {
        return;
      }

      const tableName = hoveredRef.current;
      // Nothing under the pointer is not an error, it is the ordinary case of
      // pressing the key while looking at empty canvas.
      if (tableName === null || tableName === "") {
        return;
      }

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
