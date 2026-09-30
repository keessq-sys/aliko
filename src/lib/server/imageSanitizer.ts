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
  while (offset + 4 <= input.length && input[offset] === 0xff) {
    const marker = input[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      parts.push(input.slice(offset));
      return concat(parts);
    }
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(input.slice(offset, offset + 2));
      offset += 2;
      continue;
    }
    const length = (input[offset + 2] << 8) | input[offset + 3];
    if (length < 2 || offset + 2 + length > input.length) throw new Error('Malformed JPEG image');
    // APP1 carries EXIF/XMP and APP13 commonly carries IPTC location metadata.
    if (marker !== 0xe1 && marker !== 0xed) parts.push(input.slice(offset, offset + 2 + length));
    offset += 2 + length;
  }
  throw new Error('Malformed JPEG image');
}

function stripPngMetadata(input: Uint8Array) {
  const parts = [input.slice(0, 8)];
  let offset = 8;
  while (offset + 12 <= input.length) {
    const length = new DataView(input.buffer, input.byteOffset + offset, 4).getUint32(0);
    const end = offset + 12 + length;
    if (end > input.length) throw new Error('Malformed PNG image');
    const type = text.decode(input.slice(offset + 4, offset + 8));
    if (!['eXIf', 'tEXt', 'iTXt', 'zTXt'].includes(type)) parts.push(input.slice(offset, end));
    offset = end;
    if (type === 'IEND') return concat(parts);
  }
  throw new Error('Malformed PNG image');
}

function stripWebpMetadata(input: Uint8Array) {
  const chunks: Uint8Array[] = [];
  let offset = 12;
  while (offset + 8 <= input.length) {
    const type = text.decode(input.slice(offset, offset + 4));
    const length = new DataView(input.buffer, input.byteOffset + offset + 4, 4).getUint32(0, true);
    const end = offset + 8 + length + (length % 2);
    if (end > input.length) throw new Error('Malformed WebP image');
    if (type !== 'EXIF' && type !== 'XMP ') chunks.push(input.slice(offset, end));
    offset = end;
  }
  if (offset !== input.length) throw new Error('Malformed WebP image');
  const body = concat(chunks);
  const header = input.slice(0, 12);
  new DataView(header.buffer, header.byteOffset + 4, 4).setUint32(0, body.length + 4, true);
  return concat([header, body]);
}

/** Removes location-bearing metadata without decoding or recompressing the image. */
export function sanitizeImage(input: Uint8Array, mimeType: string): Uint8Array {
  if (mimeType === 'image/jpeg') return stripJpegMetadata(input);
  if (mimeType === 'image/png') return stripPngMetadata(input);
  if (mimeType === 'image/webp') return stripWebpMetadata(input);
  if (mimeType === 'image/avif') {
    // Safe AVIF rewriting requires a full ISO-BMFF parser. Reject metadata-bearing
    // files instead of risking corrupting a customer image or leaking location data.
    const probe = text.decode(input);
    if (probe.includes('Exif') || probe.includes('mimeapplication/rdf+xml')) {
      throw new Error('Please remove metadata from this AVIF image before uploading it');
    }
    return input;
  }
  throw new Error('Unsupported image type');
}
