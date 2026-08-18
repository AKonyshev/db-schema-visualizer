import { type MessageKey } from "../messages";

// Catalog literals are never written out here: the source-language guard scans
// this directory and would flag them. Comparing against the imported catalogs
// asserts the same thing without smuggling non-English text into the sources.
const KEY = "action.autoArrange";

interface FreshI18n {
  initI18n: (language: string | undefined) => void;
  t: (key: MessageKey) => string;
  MESSAGES_EN: Record<MessageKey, string>;
  MESSAGES_RU: Record<MessageKey, string>;
  MESSAGES_ZH_CN: Record<MessageKey, string>;
}

// The chosen locale lives in a module singleton inside `t.ts`, so tests sharing
// one module registry leak into each other. In particular the "still English"
// guard below would pass merely because it happens to be declared first, and
// reordering the file — or running with --randomize — would disarm it without
// anything turning red. Each test therefore gets its own registry.
const freshI18n = async (): Promise<FreshI18n> => {
  jest.resetModules();

  const [initI18nModule, tModule, messages, ru, zhCn] = await Promise.all([
    import("../initI18n"),
    import("../t"),
    import("../messages"),
    import("../locales/ru"),
    import("../locales/zh-cn"),
  ]);

  return {
    initI18n: initI18nModule.initI18n,
    t: tModule.t,
    MESSAGES_EN: messages.MESSAGES_EN,
    MESSAGES_RU: ru.MESSAGES_RU,
    MESSAGES_ZH_CN: zhCn.MESSAGES_ZH_CN,
  };
};

describe("initI18n", () => {
  // The whole point of the function: until a host asks for a language, merely
  // importing the i18n modules must not have chosen one.
  test("leaves the interface in English until it is called", async () => {
    const { t, MESSAGES_EN } = await freshI18n();

    expect(t(KEY)).toBe(MESSAGES_EN[KEY]);
  });

  test("applies a supported language", async () => {
    const { initI18n, t, MESSAGES_EN, MESSAGES_RU } = await freshI18n();

    initI18n("ru");

    expect(t(KEY)).toBe(MESSAGES_RU[KEY]);
    expect(t(KEY)).not.toBe(MESSAGES_EN[KEY]);
  });

  test("applies Simplified Chinese", async () => {
    const { initI18n, t, MESSAGES_ZH_CN } = await freshI18n();

    initI18n("zh-cn");

    expect(t(KEY)).toBe(MESSAGES_ZH_CN[KEY]);
  });

  test("falls back to English for an unsupported language", async () => {
    const { initI18n, t, MESSAGES_EN } = await freshI18n();

    initI18n("de");

    expect(t(KEY)).toBe(MESSAGES_EN[KEY]);
  });

  test("falls back to English when no language is given", async () => {
    const { initI18n, t, MESSAGES_EN } = await freshI18n();

    initI18n(undefined);

    expect(t(KEY)).toBe(MESSAGES_EN[KEY]);
  });

  test("can be called again to change the language", async () => {
    const { initI18n, t, MESSAGES_EN } = await freshI18n();

    initI18n("ru");
    initI18n("en");

    expect(t(KEY)).toBe(MESSAGES_EN[KEY]);
  });
});
