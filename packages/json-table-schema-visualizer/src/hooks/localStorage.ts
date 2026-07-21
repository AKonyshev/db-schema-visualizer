import { useEffect, useState } from "react";

// The native `storage` event only fires in OTHER tabs/windows, so within a
// single webview a `setValue` in one component would not notify other
// `useLocalStorage(key)` instances (e.g. the diagram consuming a toolbar
// setting). We broadcast a same-window custom event to keep them in sync.
const LOCAL_STORAGE_CHANGE_EVENT = "app:local-storage-change";

function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item != null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)): void => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
      window.dispatchEvent(
        new CustomEvent(LOCAL_STORAGE_CHANGE_EVENT, { detail: { key } }),
      );
    } catch {
      // ignore storage errors in webview
    }
  };

  useEffect(() => {
    const readFromStorage = (): void => {
      try {
        const item = localStorage.getItem(key);
        setStoredValue(item != null ? (JSON.parse(item) as T) : initialValue);
      } catch {
        setStoredValue(initialValue);
      }
    };

    const handleStorageChange = (event: StorageEvent): void => {
      if (event.key === key) readFromStorage();
    };
    const handleLocalChange = (event: Event): void => {
      const detail = (event as CustomEvent<{ key: string }>).detail;
      if (detail?.key === key) readFromStorage();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleLocalChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleLocalChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
