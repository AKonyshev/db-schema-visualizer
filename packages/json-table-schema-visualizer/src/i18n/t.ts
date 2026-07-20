import { MESSAGES_EN, type MessageKey } from "./messages";
import { type SupportedLocale } from "./resolveLocale";

// Locale is immutable for the webview's lifetime: changing the VS Code display
// language requires a window reload, which recreates the webview. A module
// singleton is therefore enough — a React context would add a provider and
// re-renders for a value that never changes.
const CATALOGS: Partial<Record<SupportedLocale, Record<MessageKey, string>>> = {
  en: MESSAGES_EN,
};

let currentLocale: SupportedLocale = "en";

export const registerCatalog = (
  locale: SupportedLocale,
  catalog: Record<MessageKey, string>,
): void => {
  CATALOGS[locale] = catalog;
};

export const setLocale = (locale: SupportedLocale): void => {
  currentLocale = locale;
};

export const t = (key: MessageKey): string => {
  // English is always present, so a raw key can never reach the UI.
  return CATALOGS[currentLocale]?.[key] ?? MESSAGES_EN[key];
};
