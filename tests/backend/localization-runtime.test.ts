import { describe, expect, it } from "vitest";
import { get } from "svelte/store";
import { createI18n } from "../../src/lib/i18n";

describe("request-local language resources", () => {
  it("serves English without requiring an Arabic catalogue", () => {
    const app = createI18n("en");
    expect(get(app.t)("Properties")).toBe("Properties");
    expect(get(app.t)(123)).toBe(123);
  });
  it("renders the supplied Arabic catalogue and falls back safely", () => {
    const app = createI18n("ar", { Properties: "العقارات" });
    expect(get(app.t)("Properties")).toBe("العقارات");
    expect(get(app.t)("Untranslated")).toBe("Untranslated");
  });
  it("notifies existing subscribers when resources arrive after switching", () => {
    const app = createI18n("en");
    let text = "";
    const unsubscribe = app.t.subscribe((t) => {
      text = t("Properties");
    });
    app.locale.set("ar");
    app.setCatalog({ Properties: "العقارات" });
    expect(text).toBe("العقارات");
    app.locale.set("en");
    expect(text).toBe("Properties");
    unsubscribe();
  });
  it("does not share resource or language changes across requests", () => {
    const english = createI18n("en");
    const arabic = createI18n("ar", { Properties: "العقارات" });
    arabic.setCatalog({ Properties: "عقارات" });
    expect(get(english.t)("Properties")).toBe("Properties");
    expect(get(arabic.t)("Properties")).toBe("عقارات");
  });
});
