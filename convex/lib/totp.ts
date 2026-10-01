const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32(bytes: Uint8Array) {
  let bits = 0,
    value = 0,
    out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}
export function fromBase32(text: string) {
  let bits = 0,
    value = 0;
  const out: number[] = [];
  for (const char of text) {
    const n = alphabet.indexOf(char);
    if (n < 0) throw new Error("Invalid authenticator secret");
    value = (value << 5) | n;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}
export async function totp(secret: string, counter: number, digits = 6) {
  const key = await crypto.subtle.importKey(
    "raw",
    fromBase32(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(counter));
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, bytes),
  );
  const offset = signature[signature.length - 1] & 15;
  const value =
    (new DataView(signature.buffer).getUint32(offset) & 0x7fffffff) %
    10 ** digits;
  return String(value).padStart(digits, "0");
}
export async function encryptSecret(secret: string) {
  const key = await encryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(secret),
    ),
  );
  return `${encode(iv)}.${encode(data)}`;
}
export async function decryptSecret(value: string) {
  const [iv, data] = value.split(".");
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: decode(iv) },
      await encryptionKey(),
      decode(data),
    ),
  );
}
function encode(value: Uint8Array) {
  return btoa(String.fromCharCode(...value));
}
function decode(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
async function encryptionKey() {
  const value = process.env.MFA_ENCRYPTION_KEY;
  if (!value)
    throw new Error(
      "Administrator authentication encryption is not configured",
    );
  return crypto.subtle.importKey("raw", decode(value), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}
