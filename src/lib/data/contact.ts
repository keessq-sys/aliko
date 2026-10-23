/** Single source of truth for the company's real contact touchpoints. */
export const BUSINESS_WHATSAPP_NUMBER = "+2349033333909";

/** All customer enquiries go through the company support desk. */
export function whatsappHref(
  message?: string,
  number: string = BUSINESS_WHATSAPP_NUMBER,
): string {
  let digits = number.replace(/[^0-9]/g, "");
  if (/^0[0-9]{10}$/.test(digits)) digits = "234" + digits.slice(1);
  if (!/^[1-9][0-9]{9,14}$/.test(digits)) return "";
  return message
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digits}`;
}

export const BUSINESS_EMAIL = "alikodiamondkey@gmail.com";
