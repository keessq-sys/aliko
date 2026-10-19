import { expect, test } from "@playwright/test";
import { sanitizeImage } from "../../src/lib/server/imageSanitizer";

const ascii = (value: string) => new TextEncoder().encode(value);

test.describe("uploaded image privacy controls", () => {
  test("removes EXIF and IPTC application segments from JPEG files", () => {
    const jpeg = new Uint8Array([
      0xff,
      0xd8,
      0xff,
      0xe1,
      0x00,
      0x08,
      ...ascii("Exif00"),
      0xff,
      0xed,
      0x00,
      0x06,
      ...ascii("IPTC"),
      0xff,
      0xc0,
      0x00,
      0x08,
      0x08,
      0x00,
      0x01,
      0x00,
      0x01,
      0x01,
      0xff,
      0xda,
      0x00,
      0x02,
      0xff,
      0xd9,
    ]);
    const clean = sanitizeImage(jpeg, "image/jpeg");
    expect(new TextDecoder().decode(clean)).not.toContain("Exif");
    expect(new TextDecoder().decode(clean)).not.toContain("IPTC");
    expect([...clean.slice(0, 2)]).toEqual([0xff, 0xd8]);
  });

  test("removes textual metadata chunks from PNG files", () => {
    const signature = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const chunk = (type: string, data = new Uint8Array()) => {
      const value = new Uint8Array(12 + data.length);
      new DataView(value.buffer).setUint32(0, data.length);
      value.set(ascii(type), 4);
      value.set(data, 8);
      return value;
    };
    const header = new Uint8Array(13);
    new DataView(header.buffer).setUint32(0, 1);
    new DataView(header.buffer).setUint32(4, 1);
    const png = new Uint8Array([
      ...signature,
      ...chunk("IHDR", header),
      ...chunk("tEXt", ascii("GPS location")),
      ...chunk("IDAT", Uint8Array.from([1])),
      ...chunk("IEND"),
    ]);
    const clean = sanitizeImage(png, "image/png");
    expect(new TextDecoder().decode(clean)).not.toContain("GPS location");
    expect(new TextDecoder().decode(clean)).toContain("IEND");
  });

  test("rejects metadata-bearing AVIF until it can be safely rewritten", () => {
    const box = (type: string, data: Uint8Array = new Uint8Array()) => {
      const b = new Uint8Array(8 + data.length);
      new DataView(b.buffer).setUint32(0, b.length);
      b.set(ascii(type), 4);
      b.set(data, 8);
      return b;
    };
    const avif = new Uint8Array([
      ...box("ftyp", ascii("avif")),
      ...box("meta", ascii("Exif")),
      ...box("mdat", Uint8Array.from([1])),
    ]);
    expect(() => sanitizeImage(avif, "image/avif")).toThrow(/remove metadata/i);
  });
});
