import { describe, it, expect } from "vitest";
import { sanitizeImage } from "../../convex/lib/imageContent";
describe("image container validation", () => {
  it("rejects JPEG without a frame and scan", () =>
    expect(() =>
      sanitizeImage(Uint8Array.from([255, 216, 255, 217, 0, 0]), "image/jpeg"),
    ).toThrow());
  it("rejects WebP without image data", () =>
    expect(() =>
      sanitizeImage(
        Uint8Array.from([82, 73, 70, 70, 4, 0, 0, 0, 87, 69, 66, 80]),
        "image/webp",
      ),
    ).toThrow());
  it("rejects a PNG signature and IEND without image chunks", () => {
    const bytes = Uint8Array.from([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96,
      130,
    ]);
    expect(() => sanitizeImage(bytes, "image/png")).toThrow(/header/);
  });
  it("rejects an AVIF brand header without image containers", () => {
    const bytes = Uint8Array.from([
      0, 0, 0, 16, 102, 116, 121, 112, 97, 118, 105, 102, 0, 0, 0, 0,
    ]);
    expect(() => sanitizeImage(bytes, "image/avif")).toThrow(/containers/);
  });
});
