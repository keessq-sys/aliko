/** Single source of truth for the company's real contact touchpoints. */
export const BUSINESS_WHATSAPP_NUMBER = '+2347047669943';

export function whatsappHref(message?: string): string {
  const digits = BUSINESS_WHATSAPP_NUMBER.replace(/[^0-9]/g, '');
  return message ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : `https://wa.me/${digits}`;
}
