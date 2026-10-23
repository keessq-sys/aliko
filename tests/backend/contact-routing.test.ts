import { describe, it, expect } from "vitest";
import { whatsappHref } from "../../src/lib/data/contact";
describe("explicit agent contact", () => {
  it("uses the selected agent number and normalizes Nigerian local numbers", () => {
    expect(whatsappHref("Hello", "08012345678")).toBe(
      "https://wa.me/2348012345678?text=Hello",
    );
  });
  it("preserves company support as the default and rejects malformed numbers", () => {
    expect(whatsappHref()).toContain("2349033333909");
    expect(whatsappHref("Hi", "invalid")).toBe("");
  });
});
