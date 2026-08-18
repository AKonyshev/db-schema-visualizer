export type SupportedLocale = "en" | "ru" | "zh-cn";

// Exported so a host can test membership against it instead of keeping its own
// copy of the list. A second copy is a second thing to forget when a locale is
// added.
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = [
  "en",
  "ru",
  "zh-cn",
];

// Matching is exact, never by prefix: `zh-tw` must not fall into `zh-cn`.
// Mainland and Taiwan technical terminology differ, and the zh-cn translation
// is community-contributed and unverified — widening its reach would widen the
// blast radius of an error nobody on the team can see.
export const resolveLocale = (
  language: string | undefined,
): SupportedLocale => {
  if (language == null || language === "") {
    return "en";
  }

  const normalized = language.toLowerCase();
  const match = SUPPORTED_LOCALES.find((locale) => locale === normalized);

  return match ?? "en";
};
