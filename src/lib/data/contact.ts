/** Single source of truth for the company's real contact touchpoints. */
export const BUSINESS_WHATSAPP_NUMBER = '+2347047669943';

/** Builds a wa.me link. Defaults to the company number; pass `number` to
 *  message a specific person (e.g. an individual agent) instead. */
export function whatsappHref(message?: string, number: string = BUSINESS_WHATSAPP_NUMBER): string {
  const digits = number.replace(/[^0-9]/g, '');
  return message ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : `https://wa.me/${digits}`;
}
