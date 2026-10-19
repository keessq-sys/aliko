import { createInstance } from "i18next";
import { getContext, setContext } from "svelte";
import { writable, derived, type Readable, type Writable } from "svelte/store";
type Catalog = Record<string, string>;
export type Locale = "en" | "ar";
export type Translate = <T>(value: T) => T;
type I18n = {
  locale: Writable<Locale>;
  t: Readable<Translate>;
  setCatalog: (catalog: Catalog) => void;
};
const contextKey = Symbol.for("adk.i18n");
export function createI18n(
  initial: Locale,
  initialCatalog: Catalog = {},
): I18n {
  let catalog = initialCatalog;
  const resources = writable(initialCatalog);
  // An instance per rendered application prevents one SSR request changing another's language.
  const instance = createInstance();
  void instance.init({
    lng: initial,
    supportedLngs: ["en", "ar"],
    fallbackLng: "en",
    resources: { ar: { translation: catalog }, en: { translation: {} } },
    keySeparator: false,
    nsSeparator: false,
    initAsync: false,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  const locale = writable<Locale>(initial);
  const t = derived(
    [locale, resources],
    ([language, catalog]): Translate =>
      <T>(value: T): T => {
        if (typeof value !== "string" || language === "en") return value;
        const key = value.replace(/\s+/g, " ").trim();
        if (!Object.hasOwn(catalog, key)) return value;
        return instance.t(key, { lng: language, defaultValue: value }) as T;
      },
  );
  return {
    locale,
    t,
    setCatalog(next) {
      if (catalog === next) return;
      catalog = next;
      instance.addResourceBundle("ar", "translation", next, true, true);
      resources.set(next);
    },
  };
}
export function provideI18n(locale: Locale, catalog: Catalog = {}) {
  return setContext(contextKey, createI18n(locale, catalog));
}
export function getI18n(): I18n {
  return getContext<I18n>(contextKey) ?? createI18n("en");
}
export function getTranslation() {
  return getI18n().t;
}
