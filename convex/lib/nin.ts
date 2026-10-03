/** Arabic and Persian digits are accepted; identity numbers are never translated. */
export function normalizeNin(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0));
}
export function ninProblem(value: unknown): string | null {
  return /^\d{11}$/.test(normalizeNin(value))
    ? null
    : "Enter your 11-digit National Identification Number (NIN).";
}
function decode(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}
async function key() {
  const value = process.env.NIN_ENCRYPTION_KEY;
  if (!value || decode(value).length !== 32)
    throw new Error(
      "Identity registration is temporarily unavailable. Contact support.",
    );
  return decode(value);
}
export async function protectNin(nin: string) {
  const bytes = await key();
  const encryptionKey = await crypto.subtle.importKey(
    "raw",
    bytes,
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
        additionalData: new TextEncoder().encode("adk-nin-v1"),
      },
      encryptionKey,
      new TextEncoder().encode(nin),
    ),
  );
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const hash = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      hmacKey,
      new TextEncoder().encode(`adk-nin-v1:${nin}`),
    ),
  );
  return {
    cipher: `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...cipher))}`,
    fingerprint: btoa(String.fromCharCode(...hash)),
    lastFour: nin.slice(-4),
  };
}
export async function revealNin(cipher: string) {
  const [iv, encrypted] = cipher.split(".");
  const encryptionKey = await crypto.subtle.importKey(
    "raw",
    await key(),
    "AES-GCM",
    false,
    ["decrypt"],
  );
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decode(iv),
        additionalData: new TextEncoder().encode("adk-nin-v1"),
      },
      encryptionKey,
      decode(encrypted),
    ),
  );
}
