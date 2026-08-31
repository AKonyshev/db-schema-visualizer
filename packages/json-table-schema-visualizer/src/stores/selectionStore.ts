type Listener = () => void;

const sameMembers = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean =>
  a.size === b.size && [...a].every((name) => b.has(name));

/**
 * Which tables the reader has selected, outside React.
 *
 * Outside React for the same reason `hoverStore` is: a marquee drag changes
 * this on every pointer move, and holding it in a provider would re-render
 * every consumer of that context on each one. Components subscribe to a derived
 * slice — almost always the one boolean "am I selected" — so a drag costs the
 * tables whose answer changed and nothing else.
 *
 * Not persisted and not in `PER_DOCUMENT_STORES`: a selection is about what the
 * reader is doing this minute, not about the document.
 */
class SelectionStore {
  private selected: ReadonlySet<string> = new Set<string>();
  private readonly listeners = new Set<Listener>();

  public readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Stable while the selection does not change: `useSyncExternalStore` compares
   * snapshots by identity, and a fresh Set on every call is an infinite render.
   */
  public readonly getSelected = (): ReadonlySet<string> => this.selected;

  public readonly isSelected = (name: string): boolean =>
    this.selected.has(name);

  public readonly setSelected = (names: ReadonlySet<string>): void => {
    // The same tables mean nothing to tell anyone about, and a marquee produces
    // a great many of those.
    if (sameMembers(names, this.selected)) {
      return;
    }

    this.selected = new Set(names);
    this.emit();
  };

  public readonly clear = (): void => {
    this.setSelected(new Set<string>());
  };

  private emit(): void {
    this.listeners.forEach((listener) => {
      listener();
    });
  }
}

export const selectionStore = new SelectionStore();

/** Stable across renders, so a component that only writes never re-renders. */
export const setSelectedTables = selectionStore.setSelected;
export const clearSelection = selectionStore.clear;
export const getSelectedTables = selectionStore.getSelected;
