import { MESSAGES_RU } from "./locales/ru";
import { MESSAGES_ZH_CN } from "./locales/zh-cn";
import { resolveLocale } from "./resolveLocale";
import { registerCatalog, setLocale } from "./t";

// Each host calls this once, before its first render. Registering the catalogs
// from module scope instead — as the extension used to — makes the choice a
// side effect of an import, which runs before any host can supply a language:
// fine while there is exactly one host injecting its config onto the window,
// silently wrong for the next one.
export const initI18n = (language: string | undefined): void => {
  registerCatalog("ru", MESSAGES_RU);
  registerCatalog("zh-cn", MESSAGES_ZH_CN);
  setLocale(resolveLocale(language));
};
