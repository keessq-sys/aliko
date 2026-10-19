const text = new TextDecoder();

function concat(parts: Uint8Array[]) {
  const size = parts.reduce((total, part) => total + part.byteLength, 0);
  const result = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

function stripJpegMetadata(input: Uint8Array) {
  const parts = [input.slice(0, 2)];
  let offset = 2;
  let hasFrame = false;
  while (offset + 4 <= input.length && input[offset] === 0xff) {
    const marker = input[offset + 1];
    if (marker === 0xd9) throw new Error("JPEG requires image data");
    if (marker === 0xda) {
      if (
        !hasFrame ||
        input[input.length - 2] !== 0xff ||
        input[input.length - 1] !== 0xd9
      )
        throw new Error("JPEG requires a complete image frame");
      parts.push(input.slice(offset));
      return concat(parts);
    }
    if (
      marker === 0x00 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      parts.push(input.slice(offset, offset + 2));
      offset += 2;
      continue;
    }
    const length = (input[offset + 2] << 8) | input[offset + 3];
    if (length < 2 || offset + 2 + length > input.length)
      throw new Error("Malformed JPEG image");
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)
    ) {
      if (length < 8) throw new Error("Malformed JPEG frame");
      const height = (input[offset + 5] << 8) | input[offset + 6];
      const width = (input[offset + 7] << 8) | input[offset + 8];
      if (!width || !height || width * height > 40_000_000)
        throw new Error("Invalid image dimensions");
      hasFrame = true;
    }
    // APP1 carries EXIF/XMP and APP13 commonly carries IPTC location metadata.
    if (marker !== 0xe1 && marker !== 0xed)
      parts.push(input.slice(offset, offset + 2 + length));
    offset += 2 + length;
  }
  throw new Error("Malformed JPEG image");
}

function stripPngMetadata(input: Uint8Array) {
  const parts = [input.slice(0, 8)];
  let offset = 8;
  let hasHeader = false,
    hasData = false;
  while (offset + 12 <= input.length) {
    const length = new DataView(
      input.buffer,
      input.byteOffset + offset,
      4,
    ).getUint32(0);
    const end = offset + 12 + length;
    if (end > input.length) throw new Error("Malformed PNG image");
    const type = text.decode(input.slice(offset + 4, offset + 8));
    if (!hasHeader) {
      if (type !== "IHDR" || length !== 13)
        throw new Error("PNG requires a valid header");
      const view = new DataView(input.buffer, input.byteOffset + offset + 8, 8);
      const width = view.getUint32(0),
        height = view.getUint32(4);
      if (!width || !height || width * height > 40_000_000)
        throw new Error("Invalid image dimensions");
      hasHeader = true;
    } else if (type === "IHDR") throw new Error("Duplicate PNG header");
    if (type === "IDAT" && length > 0) hasData = true;
    if (type === "IEND" && (!hasData || length !== 0))
      throw new Error("PNG requires image data");
    if (!["eXIf", "tEXt", "iTXt", "zTXt"].includes(type))
      parts.push(input.slice(offset, end));
    offset = end;
    if (type === "IEND") return concat(parts);
  }
  throw new Error("Malformed PNG image");
}

function stripWebpMetadata(input: Uint8Array) {
  const chunks: Uint8Array[] = [];
  let hasImageData = false;
  let offset = 12;
  while (offset + 8 <= input.length) {
    const type = text.decode(input.slice(offset, offset + 4));
    const length = new DataView(
      input.buffer,
      input.byteOffset + offset + 4,
      4,
    ).getUint32(0, true);
    const end = offset + 8 + length + (length % 2);
    if (end > input.length) throw new Error("Malformed WebP image");
    if (["VP8 ", "VP8L", "ANMF"].includes(type) && length > 5)
      hasImageData = true;
    if (type !== "EXIF" && type !== "XMP ")
      chunks.push(input.slice(offset, end));
    offset = end;
  }
  if (offset !== input.length) throw new Error("Malformed WebP image");
  if (!hasImageData) throw new Error("WebP requires image data");
  const body = concat(chunks);
  const header = input.slice(0, 12);
  new DataView(header.buffer, header.byteOffset + 4, 4).setUint32(
    0,
    body.length + 4,
    true,
  );
  return concat([header, body]);
}

/** Removes location-bearing metadata without decoding or recompressing the image. */
export function sanitizeImage(input: Uint8Array, mimeType: string): Uint8Array {
  if (mimeType === "image/jpeg") return stripJpegMetadata(input);
  if (mimeType === "image/png") return stripPngMetadata(input);
  if (mimeType === "image/webp") return stripWebpMetadata(input);
  if (mimeType === "image/avif") {
    let offset = 0;
    const boxes = new Set<string>();
    while (offset + 8 <= input.length) {
      const length = new DataView(
        input.buffer,
        input.byteOffset + offset,
        4,
      ).getUint32(0);
      const type = text.decode(input.slice(offset + 4, offset + 8));
      if (length < 8 || offset + length > input.length)
        throw new Error("Malformed AVIF container");
      boxes.add(type);
      offset += length;
    }
    if (
      offset !== input.length ||
      !boxes.has("ftyp") ||
      !boxes.has("meta") ||
      !boxes.has("mdat")
    )
      throw new Error("AVIF requires complete image containers");
    // Safe AVIF rewriting requires a full ISO-BMFF parser. Reject metadata-bearing
    // files instead of risking corrupting a customer image or leaking location data.
    const probe = text.decode(input);
    if (probe.includes("Exif") || probe.includes("mimeapplication/rdf+xml")) {
      throw new Error(
        "Please remove metadata from this AVIF image before uploading it",
      );
    }
    return input;
  }
  throw new Error("Unsupported image type");
}
