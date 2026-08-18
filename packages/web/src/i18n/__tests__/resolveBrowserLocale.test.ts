import { resolveBrowserLocale } from "../resolveBrowserLocale";

describe("resolveBrowserLocale", () => {
  test("matches a plain tag", () => {
    expect(resolveBrowserLocale(["ru"])).toBe("ru");
  });

  // Browsers report the region. Handing `ru-RU` straight to the exact-matching
  // resolver would serve English to every Russian speaker, silently.
  test("falls back to the primary subtag of a regional tag", () => {
    expect(resolveBrowserLocale(["ru-RU"])).toBe("ru");
  });

  test("matches the full tag before trying the subtag", () => {
    expect(resolveBrowserLocale(["zh-CN"])).toBe("zh-cn");
  });

  // The reason the underlying resolver matches exactly: mainland and Taiwan
  // terminology differ, and the Simplified catalog is community-contributed and
  // unreviewed. Widening the match would ship it to an audience nobody checked
  // it against — so this case is the one that must never start passing as
  // "zh-cn".
  test("never widens Traditional Chinese into Simplified", () => {
    expect(resolveBrowserLocale(["zh-TW"])).toBe("en");
  });

  test("is case-insensitive about the tag", () => {
    expect(resolveBrowserLocale(["RU-ru"])).toBe("ru");
  });

  test("honours the order of preference", () => {
    expect(resolveBrowserLocale(["de", "ru-RU"])).toBe("ru");
  });

  test("falls back to English for an unsupported language", () => {
    expect(resolveBrowserLocale(["de-AT"])).toBe("en");
  });

  test("falls back to English for an empty list", () => {
    expect(resolveBrowserLocale([])).toBe("en");
  });

  test("falls back to English when the list is missing", () => {
    expect(resolveBrowserLocale(undefined)).toBe("en");
  });
});
