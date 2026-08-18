abstract class Storage<T> {
  abstract getItem(key: string): object | null;
  abstract setItem(key: string, value: T): void;
  abstract removeItem(key: string): void;
  /**
   * Every key currently held, whoever wrote it. A store that wants to forget
   * all of its own documents has no other way to learn which they are: the
   * names were the callers' to invent.
   */
  abstract keys(): string[];
}

export default Storage;
