import { initI18n } from "@/i18n/initI18n";
import { MESSAGES_EN } from "@/i18n/messages";
import { MESSAGES_RU } from "@/i18n/locales/ru";
import { MESSAGES_ZH_CN } from "@/i18n/locales/zh-cn";
import { t } from "@/i18n/t";

// Catalog literals are never written out here: the source-language guard scans
// this directory and would flag them. Comparing against the imported catalogs
// asserts the same thing without smuggling non-English text into the sources.
const KEY = "action.autoArrange";

describe("initI18n", () => {
  // The whole point of the function: until a host asks for a language, merely
  // importing the i18n modules must not have chosen one.
  it("leaves the interface in English until it is called", () => {
    expect(t(KEY)).toBe(MESSAGES_EN[KEY]);
  });

  it("applies a supported language", () => {
    initI18n("ru");

    expect(t(KEY)).toBe(MESSAGES_RU[KEY]);
    expect(t(KEY)).not.toBe(MESSAGES_EN[KEY]);
  });

  it("applies Simplified Chinese", () => {
    initI18n("zh-cn");

    expect(t(KEY)).toBe(MESSAGES_ZH_CN[KEY]);
  });

  it("falls back to English for an unsupported language", () => {
    initI18n("de");

    expect(t(KEY)).toBe(MESSAGES_EN[KEY]);
  });

  it("falls back to English when no language is given", () => {
    initI18n(undefined);

    expect(t(KEY)).toBe(MESSAGES_EN[KEY]);
  });

  it("can be called again to change the language", () => {
    initI18n("ru");
    initI18n("en");

    expect(t(KEY)).toBe(MESSAGES_EN[KEY]);
  });
});
