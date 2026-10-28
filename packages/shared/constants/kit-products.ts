/**
 * Facility shop catalogue — Devices and Kits (not screening types).
 * Matches the ZeroCancer procurement brief.
 */
export const KIT_AND_DEVICE_PRODUCTS = [
  {
    id: "HPV_ONCOPROTEIN_E6_E7_RAPID",
    name: "HPV Oncoprotein E6/E7 Rapid Test Kits",
    shortName: "HPV Oncoprotein E6/E7",
    description: "Minimum order 25 packets.",
    minQuantity: 25,
    unitLabel: "packets",
    kind: "kit" as const,
  },
  {
    id: "MOLECULAR_POCT_ANALYZER",
    name: "Analyzer for Molecular POCT Enzymatic Rapid Amplification for HPV DNA/mRNA E6/E7",
    shortName: "Molecular POCT Analyzer",
    description: "Analyzer unit for molecular POCT HPV DNA/mRNA E6/E7.",
    minQuantity: 1,
    unitLabel: "units",
    kind: "device" as const,
  },
  {
    id: "MOLECULAR_POCT_KITS",
    name: "Kits for Molecular POCT Enzymatic Rapid Amplification for HPV DNA/mRNA E6/E7",
    shortName: "Molecular POCT Kits",
    description: "Reagent / amplification kits for the molecular POCT analyzer.",
    minQuantity: 1,
    unitLabel: "kits",
    kind: "kit" as const,
  },
  {
    id: "MOLECULAR_POCT_BUNDLE_2500",
    name: "Buy 2500 kits and get one free Analyzer for Molecular POCT Enzymatic Rapid Amplification for HPV DNA/mRNA E6/E7",
    shortName: "2500 kits + free Analyzer",
    description:
      "Bundle: 2500 molecular POCT kits with one complimentary analyzer per bundle.",
    minQuantity: 1,
    unitLabel: "bundles",
    kind: "bundle" as const,
    bundleNote: "Each bundle = 2500 kits + 1 free analyzer",
  },
  {
    id: "TRUSCREEN_ULTRA_DEVICE",
    name: "Truscreen Ultra Device",
    shortName: "Truscreen Ultra",
    description: "Truscreen Ultra screening device.",
    minQuantity: 1,
    unitLabel: "devices",
    kind: "device" as const,
  },
  {
    id: "TRUSCREEN_SUS_PKT",
    name: "Single Use Sensors for Truscreen Min 1pkt (180 units)",
    shortName: "Truscreen SUS (180/pkt)",
    description: "Minimum 1 packet (180 single-use sensors).",
    minQuantity: 1,
    unitLabel: "packets",
    kind: "kit" as const,
  },
] as const;

export type TKitProductId = (typeof KIT_AND_DEVICE_PRODUCTS)[number]["id"];

/** @deprecated Use KIT_AND_DEVICE_PRODUCTS — kept for older imports. */
export const CERVICAL_KIT_PRODUCTS = KIT_AND_DEVICE_PRODUCTS;

export const KIT_PRODUCTS = [...KIT_AND_DEVICE_PRODUCTS];

/** Platform screening type used only to satisfy inventory FK; not shown in the shop. */
export const DEFAULT_KIT_ORDER_SCREENING_TYPE_ID =
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

export function isCervicalScreeningName(name?: string | null) {
  const value = (name || "").toLowerCase();
  return (
    value.includes("cervical") ||
    (value.includes("hpv") && !value.includes("vaccin"))
  );
}

/** Full shop catalogue (no longer filtered by screening type). */
export function kitShopCatalog() {
  return [...KIT_AND_DEVICE_PRODUCTS];
}

/** @deprecated Prefer kitShopCatalog() — shop is product-based now. */
export function kitProductsForScreening(_name?: string | null) {
  return kitShopCatalog();
}

export function kitProductById(id?: string | null) {
  return KIT_PRODUCTS.find((product) => product.id === id) || null;
}

export function kitProductLabel(id?: string | null) {
  if (!id) return null;
  return kitProductById(id)?.name || id.replace(/_/g, " ");
}

export function isKitProductId(value: string): value is TKitProductId {
  return KIT_PRODUCTS.some((product) => product.id === value);
}

export function kitProductMinQuantity(id?: string | null) {
  return kitProductById(id)?.minQuantity ?? 1;
}
