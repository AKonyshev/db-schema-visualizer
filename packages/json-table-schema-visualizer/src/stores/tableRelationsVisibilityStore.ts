import { PersistableStore } from "./PersitableStore";

class TableRelationsVisibilityStore extends PersistableStore<
  Record<string, boolean>
> {
  private readonly hiddenRelationsByKey = new Map<string, Set<string>>();
  private activeKey: string | null = null;

  constructor() {
    super("tableRelationsVisibility");
  }

  public switchTo(storeKey: string): void {
    this.activeKey = storeKey;
    const saved = this.retrieve(storeKey) as Record<string, boolean> | null;
    if (saved != null) {
      this.hiddenRelationsByKey.set(
        storeKey,
        new Set(Object.keys(saved).filter((key) => saved[key])),
      );
    } else {
      this.hiddenRelationsByKey.set(storeKey, new Set());
    }
  }

  public toggleTableRelations(tableName: string): void {
    const key = this.activeKey ?? "default";
    let hiddenSet = this.hiddenRelationsByKey.get(key);
    if (hiddenSet == null) {
      hiddenSet = new Set();
      this.hiddenRelationsByKey.set(key, hiddenSet);
    }

    if (hiddenSet.has(tableName)) {
      hiddenSet.delete(tableName);
    } else {
      hiddenSet.add(tableName);
    }

    this.persist(key, this.getCurrentState());
  }

  public areTableRelationsHidden(tableName: string): boolean {
    const key = this.activeKey ?? "default";
    const hiddenSet = this.hiddenRelationsByKey.get(key);
    return hiddenSet?.has(tableName) ?? false;
  }

  private getCurrentState(): Record<string, boolean> {
    const key = this.activeKey ?? "default";
    const hiddenSet = this.hiddenRelationsByKey.get(key);
    if (hiddenSet == null) return {};

    const result: Record<string, boolean> = {};
    hiddenSet.forEach((tableName) => {
      result[tableName] = true;
    });
    return result;
  }
}

export const tableRelationsVisibilityStore =
  new TableRelationsVisibilityStore();
