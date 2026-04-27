export type Governorate = "Cairo" | "Giza" | "Alexandria" | "Other";
export type ApplianceCategory = "cooling" | "lighting" | "kitchen" | "media" | "laundry" | "other";

export interface ApplianceVariant {
  id: string;
  variant_label_ar: string;
  variant_label_en: string;
  running_watts: number;
  surge_watts: number;
}

export interface Appliance {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  category: ApplianceCategory;
  inductive: boolean;
  icon: string;
  notes_ar?: string;
  notes_en?: string;
  variants: ApplianceVariant[];
}

export interface AppliancePick {
  applianceId: string;
  variantId: string;
  count: number;
  isInverter?: boolean;
  // For appliances added via the scanner that don't match the catalog,
  // OR via manual wattage entry. Bypasses the appliance/variant lookup
  // in calculateSizing and uses these values directly.
  customWatts?: number;
  customLabel?: string;
  customInductive?: boolean;
  customIcon?: string; // lucide-react icon name (kebab or PascalCase) for custom appliances
}

export interface SizingInput {
  picks: AppliancePick[];
  backupHours: number;
}

export interface SizingResult {
  inverterKw: number;
  systemVoltage: 12 | 24 | 48;
  battery: { qty: number; ahEach: number };
  totalRunningWatts: number;
  estimatedPriceEgp: { min: number; max: number };
  warnings: string[];
  tooLarge: boolean;
}

export type ShopTier = "local" | "premium" | "digital";

export interface Shop {
  id: string;
  name: string;
  governorate: Governorate;
  area: string;
  whatsapp_number: string;
  maps_url: string;
  facebook_url?: string | null;
  website_url?: string | null;
  phone_number?: string | null;
  logo_url?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  tier?: ShopTier | null;
  specialty_tags: string[];
  is_active: boolean;
}
