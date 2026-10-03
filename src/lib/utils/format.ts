export function formatDateTime(input?: number | string | null, locale = "en"): string {
  if (input == null) return "—";
  const date = new Date(input);
  return `${formatDate(date, locale)} · ${date.toLocaleTimeString(locale === "ar" ? "ar-NG" : "en-NG", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
}
export function formatNaira(amount: number, locale = "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-NG" : "en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);
}
export function formatUSD(amount: number, locale = "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);
}
export function formatPrice(amount: number, currency: "NGN" | "USD" = "NGN", locale = "en"): string {
  return currency === "NGN" ? formatNaira(amount, locale) : formatUSD(amount, locale);
}
export function formatSqm(sqm: number, locale = "en"): string {
  return `${new Intl.NumberFormat(locale === "ar" ? "ar" : "en-US").format(sqm)} ${locale === "ar" ? "م²" : "sqm"}`;
}
export function formatDate(date: Date | string, locale = "en"): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-NG" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(typeof date === "string" ? new Date(date) : date);
}
export function formatRelative(date: Date | string, locale = "en"): string {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const intervals: Array<[Intl.RelativeTimeFormatUnit, number]> = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  const [unit, scale] = intervals.find(([, size]) => Math.abs(seconds) >= size) ?? intervals[intervals.length - 1];
  return new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", { numeric: "always" }).format(Math.trunc(seconds / scale), unit);
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\+\d{3})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function truncate(text: string, len: number): string {
  if (text.length <= len) return text;
  return text.slice(0, len) + '...';
}

export function formatBedBath(beds: number, baths: number, locale = "en"): string {
  return locale === "ar" ? `${beds} غرف نوم · ${baths} حمامات` : `${beds} Bed · ${baths} Bath`;
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
