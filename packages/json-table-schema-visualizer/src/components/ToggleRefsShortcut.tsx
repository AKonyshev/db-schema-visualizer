import { useEffect, useRef } from "react";

import { useTablesInfo } from "@/hooks/table";
import { toggleTableRelations } from "@/stores/toggleTableRelations";
import { matchesToggleRefsShortcut } from "@/utils/matchesToggleRefsShortcut";

/**
 * Alt+H: hide or show the relations of the table the pointer is over.
 *
 * The same action as the link icon in the table header, reached from the
 * keyboard — one store, one event, so the two can never disagree. Nothing is
 * written to the schema file.
 *
 * Rendered from inside the viewer's providers rather than from the page around
 * it, because it needs the one thing only they know: which table is hovered.
 *
 * It renders nothing. What it contributes is a window listener, and a component
 * is simply how a hook reaches a context it would otherwise be outside of.
 */
const ToggleRefsShortcut = (): null => {
  const { hoveredTableName } = useTablesInfo();

  // Through a ref, so that hovering a table — which changes on every mouse move
  // across the diagram — does not detach and reattach the listener.
  const hoveredRef = useRef(hoveredTableName);
  hoveredRef.current = hoveredTableName;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!matchesToggleRefsShortcut(event)) {
        return;
      }

      // preventDefault even when nothing is hovered: on a Mac the chord types
      // "˙" into the editor beside the diagram.
      event.preventDefault();
      toggleTableRelations(hoveredRef.current ?? "");
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
