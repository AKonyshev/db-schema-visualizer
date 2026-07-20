import { useEffect, useRef } from "react";

import type { ExecutableShortcutId } from "@/constants/shortcuts";

import { matchShortcut, type ShortcutEventLike } from "@/utils/matchShortcut";

export const useKeyboardShortcuts = (
  handlers: Record<ExecutableShortcutId, () => void>,
  enabled: boolean,
): void => {
  // Через ref, иначе новая идентичность объекта handlers на каждом рендере
  // переподписывала бы слушатель.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!enabledRef.current) {
        return;
      }
      const id = matchShortcut({
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        target: event.target as ShortcutEventLike["target"],
      });
      if (id == null) {
        return;
      }
      const handler = handlersRef.current[id];
      if (handler === undefined) {
        return;
      }
      event.preventDefault();
      handler();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
};
