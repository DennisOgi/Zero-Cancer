export const CERVICAL_KIT_PRODUCTS = [
  {
    id: "MOBILAB_HPV_RAPID",
    name: "Mobilab HPV Rapid Test Kits",
    shortName: "Mobilab HPV",
  },
  {
    id: "TRUSCREEN_SUS",
    name: "TruScreen Single Use Sensor (SUS)",
    shortName: "TruScreen SUS",
  },
  {
    id: "TRUSCREEN_DEVICE",
    name: "TruScreen Device",
    shortName: "TruScreen Device",
  },
] as const;

export type TKitProductId = (typeof CERVICAL_KIT_PRODUCTS)[number]["id"];

export const KIT_PRODUCTS = [...CERVICAL_KIT_PRODUCTS];

export function isCervicalScreeningName(name?: string | null) {
  const value = (name || "").toLowerCase();
  return value.includes("cervical") || (value.includes("hpv") && !value.includes("vaccin"));
}

export function kitProductsForScreening(name?: string | null) {
  return isCervicalScreeningName(name) ? [...CERVICAL_KIT_PRODUCTS] : [];
}

export function kitProductLabel(id?: string | null) {
  return KIT_PRODUCTS.find((product) => product.id === id)?.name || null;
}

export function isKitProductId(value: string): value is TKitProductId {
  return KIT_PRODUCTS.some((product) => product.id === value);
}
