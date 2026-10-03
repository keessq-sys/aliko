// Adapted from Open Admin Data Nigeria, CC-BY-4.0. See docs/NIGERIA_LOCATION_DATA.md.
import catalogue from "./nigeriaLocations.json";
export const NIGERIAN_STATES = Object.keys(catalogue).sort();
export function normalizeState(value: string): string {
  return /^(Abuja|Abuja,? FCT|FCT|Federal Capital Territory|FCT Abuja)$/i.test(
    value.trim(),
  )
    ? "FCT Abuja"
    : value.trim();
}
export function nigeriaLgas(state: string): string[] {
  return (catalogue as Record<string, string[]>)[normalizeState(state)] ?? [];
}
export function assertNigeriaLocation(state: string, lga?: string) {
  if (!NIGERIAN_STATES.includes(normalizeState(state)))
    throw new Error("Select a valid Nigerian state or Abuja FCT.");
  if (lga && !nigeriaLgas(state).includes(lga))
    throw new Error("Select an LGA belonging to the selected state.");
}
