import { STORAGE_KEYS } from "@/constants/storageKeys";
import { RelationStyle, isRelationStyle } from "@/types/relationStyle";

export const DEFAULT_RELATION_STYLE = RelationStyle.Orthogonal;

/**
 * The chosen relation style, read outside React.
 *
 * The toolbar keeps this setting through `useLocalStorage`, which is a hook and
 * so of no use to the layout — that runs from a store, with no component to
 * hang a hook on. Reading the same key the same way keeps the two in step; the
 * hook writes JSON, so this parses it.
 */
export const getRelationStyle = (): RelationStyle => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RELATION_STYLE);
    if (raw === null) {
      return DEFAULT_RELATION_STYLE;
    }

    const parsed: unknown = JSON.parse(raw);

    return isRelationStyle(parsed) ? parsed : DEFAULT_RELATION_STYLE;
  } catch {
    return DEFAULT_RELATION_STYLE;
  }
};
