import {
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "json-table-schema-visualizer/src/i18n/resolveLocale";

const isSupported = (candidate: string): candidate is SupportedLocale =>
  SUPPORTED_LOCALES.some((locale) => locale === candidate);

// Browsers report regional tags — `ru-RU` — while the catalogs are keyed by
// plain ones, plus the single regional exception `zh-cn`. Trying the full tag
// first and the primary subtag second covers both.
//
// The widening stops there. It has to: see the comment on `resolveLocale` for
// why the match is exact. `zh-tw` fails the full tag, then fails a bare `zh`,
// and lands on English — which is the answer that comment exists to protect.
export const resolveBrowserLocale = (
  languages: readonly string[] | undefined,
): SupportedLocale => {
  for (const language of languages ?? []) {
    const full = language.toLowerCase();
    if (isSupported(full)) {
      return full;
    }

    const primary = full.split("-")[0];
    if (isSupported(primary)) {
      return primary;
    }
  }

  return "en";
};
