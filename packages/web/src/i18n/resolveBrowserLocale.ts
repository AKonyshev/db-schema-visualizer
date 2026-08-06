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
// The widening stops there, and that is the point. `resolveLocale` matches
// exactly so that `zh-tw` cannot reach the Simplified Chinese catalog: mainland
// and Taiwan terminology differ, and that translation is community-contributed
// and unreviewed by a native speaker. Falling back from `zh-tw` to a bare `zh`
// finds nothing, which is the correct answer — English — rather than a
// confident one nobody has checked.
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
