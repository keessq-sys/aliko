export function passwordProblem(value: string): string | null {
  if (value.length < 12 || value.length > 128)
    return "Use 12–128 characters with uppercase, lowercase, a number and a symbol.";
  if (
    !/[A-Z]/.test(value) ||
    !/[a-z]/.test(value) ||
    !/[0-9]/.test(value) ||
    !/[^A-Za-z0-9\s]/.test(value)
  )
    return "Include uppercase, lowercase, a number and a symbol.";
  return null;
}
export function passwordScore(value: string): number {
  return [
    value.length >= 12,
    /[A-Z]/.test(value),
    /[a-z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9\s]/.test(value),
  ].filter(Boolean).length;
}
