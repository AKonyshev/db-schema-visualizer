import type Storage from "@/types/storage";

import { AppLocalStorage } from "@/storages/local";

export class PersistableStore<T> {
  private readonly storeName: string;
  private readonly storage: Storage<T>;

  constructor(storeName: string, storage?: Storage<T>) {
    this.storeName = storeName;
    this.storage = storage ?? new AppLocalStorage<T>();
  }

  createPersistanceKey(key: string): string {
    return `${this.storeName}:${key}`;
  }

  persist(name: string, value: T): void {
    const persistanceKey = this.createPersistanceKey(name);

    this.storage.setItem(persistanceKey, value);
  }

  retrieve(name: string): object | null {
    const persistanceKey = this.createPersistanceKey(name);

    return this.storage.getItem(persistanceKey);
  }

  clear(name: string): void {
    const persistanceKey = this.createPersistanceKey(name);

    this.storage.removeItem(persistanceKey);
  }

  /**
   * Every document this store has filed, forgotten — for a host that has lost
   * track of which documents were its own and cannot name them one by one.
   *
   * It lives here because the two things it needs are both private: the key
   * prefix, and which storage this particular store writes to. A caller
   * reconstructing either would be guessing at both, and would guess wrong the
   * first time a store moved between `localStorage` and `sessionStorage`.
   *
   * Only storage is touched. Whatever the store is holding in memory is still
   * held, and will be written back the next time it saves — so this is for a
   * caller clearing up before any document has been switched to, not for one
   * mid-session.
   */
  clearAll(): void {
    const prefix = this.createPersistanceKey("");

    for (const key of this.storage.keys()) {
      if (key.startsWith(prefix)) {
        this.storage.removeItem(key);
      }
    }
  }
}
