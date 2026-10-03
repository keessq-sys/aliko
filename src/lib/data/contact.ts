/** Single source of truth for the company's real contact touchpoints. */
export const BUSINESS_WHATSAPP_NUMBER = "+2347047669943";

/** All customer enquiries go through the company support desk. */
export function whatsappHref(
  message?: string,
  _number: string = BUSINESS_WHATSAPP_NUMBER,
): string {
  const digits = BUSINESS_WHATSAPP_NUMBER.replace(/[^0-9]/g, "");
  return message
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digits}`;
}

export const BUSINESS_EMAIL = "alikodiamondkey@gmail.com";
