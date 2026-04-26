import { describe, it, expect } from "vitest";
import { calculateSizing } from "./sizing";
import type { SizingInput, Appliance } from "./types";

const empty: SizingInput = { picks: [], backupHours: 4 };

describe("calculateSizing — guardrails", () => {
  it("throws on empty picks", () => {
    expect(() => calculateSizing(empty, [])).toThrow(/no appliances/i);
  });

  it("throws on backupHours out of range", () => {
    const valid: SizingInput = { picks: [{ applianceId: "a", variantId: "v", count: 1 }], backupHours: 0 };
    const stub: Appliance[] = [{
      id: "a", slug: "a", name_ar: "x", name_en: "x", category: "other", inductive: false, icon: "x",
      variants: [{ id: "v", variant_label_ar: "x", variant_label_en: "x", running_watts: 10, surge_watts: 10 }],
    }];
    expect(() => calculateSizing(valid, stub)).toThrow(/backup hours/i);
  });
});

const catalog: Appliance[] = [
  {
    id: "ac", slug: "split-ac", name_ar: "تكييف", name_en: "AC",
    category: "cooling", inductive: true, icon: "air-vent",
    variants: [
      { id: "ac-1.5", variant_label_ar: "1.5 حصان", variant_label_en: "1.5 HP", running_watts: 1100, surge_watts: 3300 },
    ],
  },
  {
    id: "fridge", slug: "fridge", name_ar: "تلاجة", name_en: "Fridge",
    category: "kitchen", inductive: true, icon: "refrigerator",
    variants: [
      { id: "fridge-m", variant_label_ar: "وسط", variant_label_en: "Medium", running_watts: 150, surge_watts: 900 },
    ],
  },
  {
    id: "led", slug: "led-bulb", name_ar: "لمبة", name_en: "LED",
    category: "lighting", inductive: false, icon: "lightbulb",
    variants: [
      { id: "led-9", variant_label_ar: "9", variant_label_en: "9W", running_watts: 9, surge_watts: 9 },
    ],
  },
];

describe("calculateSizing — single AC", () => {
  it("1.5HP AC alone → 5kW inverter (handles surge)", () => {
    // running 1100 + surge_extra (3300-1100)=2200. total 3300W × 1.20 = 3960W → 5kW. 48V.
    const r = calculateSizing({ picks: [{ applianceId: "ac", variantId: "ac-1.5", count: 1 }], backupHours: 4 }, catalog);
    expect(r.inverterKw).toBe(5);
    expect(r.systemVoltage).toBe(48);
    expect(r.tooLarge).toBe(false);
  });
});
