import { resolveLocale } from "../resolveLocale";

describe("resolveLocale", () => {
  test("maps supported languages to their locale", () => {
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("ru")).toBe("ru");
    expect(resolveLocale("zh-cn")).toBe("zh-cn");
  });

  test("is case-insensitive", () => {
    expect(resolveLocale("ZH-CN")).toBe("zh-cn");
    expect(resolveLocale("RU")).toBe("ru");
  });

  test("falls back to English for Traditional Chinese", () => {
    // zh-tw must NOT get Simplified Chinese: mainland and Taiwan technical
    // terminology diverge (the words for "database" and "default" differ), and
    // the zh-cn translation is itself unverified, so widening its reach would
    // widen the reach of an error nobody on the team can see.
    expect(resolveLocale("zh-tw")).toBe("en");
  });

  test("falls back to English for any unsupported language", () => {
    expect(resolveLocale("de")).toBe("en");
    expect(resolveLocale("ja")).toBe("en");
    expect(resolveLocale("pt-br")).toBe("en");
  });

  test("falls back to English when the language is missing", () => {
    expect(resolveLocale(undefined)).toBe("en");
    expect(resolveLocale("")).toBe("en");
  });
});
