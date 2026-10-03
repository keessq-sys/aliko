import { createInstance } from "i18next";
import { getContext, setContext } from "svelte";
import { writable, derived, type Readable, type Writable } from "svelte/store";
import arabic from "./ar.json";
export type Locale = "en" | "ar";
export type Translate = <T>(value: T) => T;
type I18n = { locale: Writable<Locale>; t: Readable<Translate> };
const contextKey = Symbol.for("adk.i18n");
export function createI18n(initial: Locale): I18n {
  // An instance per rendered application prevents one SSR request changing another's language.
  const instance = createInstance();
  void instance.init({
    lng: initial,
    supportedLngs: ["en", "ar"],
    fallbackLng: "en",
    resources: { ar: { translation: arabic }, en: { translation: {} } },
    keySeparator: false,
    nsSeparator: false,
    initAsync: false,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  const locale = writable<Locale>(initial);
  const t = derived(locale, (language): Translate => <T>(value: T): T => {
    if (typeof value !== "string" || language === "en") return value;
    const key = value.replace(/\s+/g, " ").trim();
    if (!Object.hasOwn(arabic, key)) return value;
    return instance.t(key, { lng: language, defaultValue: value }) as T;
  });
  return { locale, t };
}
export function provideI18n(locale: Locale) {
  return setContext(contextKey, createI18n(locale));
}
export function getI18n(): I18n {
  return getContext<I18n>(contextKey) ?? createI18n("en");
}
export function getTranslation() {
  return getI18n().t;
}
