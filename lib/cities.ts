// Delivery cities — trimmed down to the cities near Lahore (per request).
// Used to drive the checkout city dropdown and to derive the shipping
// province server-side (no separate province field needed at checkout).
export const CITIES = [
  { name: "Lahore", province: "Punjab" },
  { name: "Sheikhupura", province: "Punjab" },
  { name: "Kasur", province: "Punjab" },
  { name: "Gujranwala", province: "Punjab" },
  { name: "Hafizabad", province: "Punjab" },
  { name: "Okara", province: "Punjab" },
  { name: "Sialkot", province: "Punjab" },
  { name: "Gujrat", province: "Punjab" },
  { name: "Faisalabad", province: "Punjab" },
  { name: "Sahiwal", province: "Punjab" },
] as const;

export type CityName = (typeof CITIES)[number]["name"];

const PROVINCE_BY_CITY = new Map<string, string>(CITIES.map((c) => [c.name, c.province]));

/** Returns the province for a known checkout city, or null if not recognized. */
export function provinceForCity(city: string): string | null {
  return PROVINCE_BY_CITY.get(city) ?? null;
}
