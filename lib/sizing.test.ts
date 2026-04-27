import { describe, it, expect } from "vitest";
import { calculateSizing } from "./sizing";
import { estimatePriceEgp } from "./price-estimate";
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

describe("calculateSizing — combined household", () => {
  it("AC 1.5HP + fridge + 5 LED bulbs, 4h → 5kW + 1× 200Ah", () => {
    const r = calculateSizing(
      {
        picks: [
          { applianceId: "ac",     variantId: "ac-1.5",   count: 1 },
          { applianceId: "fridge", variantId: "fridge-m", count: 1 },
          { applianceId: "led",    variantId: "led-9",    count: 5 },
        ],
        backupHours: 4,
      },
      catalog,
    );
    // running: 1100 + 150 + 45 = 1295W
    // max surge_extra: AC = 2200 (highest among inductive)
    // required: (1295 + 2200) × 1.20 = 4194W → 5kW, 48V
    // energy: 1295 × 4 = 5180Wh / (0.85 × 0.80) = 7617.6Wh
    // required Ah at 48V = 158.7 → pick 200Ah × 1
    expect(r.inverterKw).toBe(5);
    expect(r.systemVoltage).toBe(48);
    expect(r.battery).toEqual({ qty: 1, ahEach: 200 });
    expect(r.totalRunningWatts).toBe(1295);
  });

  it("only 5 LED 9W bulbs, 6h → 1kW + 1× 100Ah, 12V", () => {
    const r = calculateSizing(
      { picks: [{ applianceId: "led", variantId: "led-9", count: 5 }], backupHours: 6 },
      catalog,
    );
    // 45W × 1.20 = 54W → 1kW. 12V.
    // 45 × 6 / (0.85 × 0.80) = 397.0Wh / 12V = 33Ah → 100Ah × 1
    expect(r.inverterKw).toBe(1);
    expect(r.systemVoltage).toBe(12);
    expect(r.battery).toEqual({ qty: 1, ahEach: 100 });
  });
});

describe("calculateSizing — too large", () => {
  it("8× 1.5HP AC → tooLarge", () => {
    const r = calculateSizing(
      { picks: [{ applianceId: "ac", variantId: "ac-1.5", count: 8 }], backupHours: 4 },
      catalog,
    );
    // running 8800, surge_extra (8 ACs all inductive) = (3300-1100)×8 = 17600
    // total (8800 + 17600) × 1.20 = 31680W → no standard fits (>10kW)
    expect(r.tooLarge).toBe(true);
    expect(r.warnings).toContain("TOO_LARGE");
  });
});

describe("calculateSizing — inverter AC (soft-start, no surge)", () => {
  it("solo inverter AC 1.5HP → 1.5kW (was 5kW without inverter tag)", () => {
    const r = calculateSizing(
      { picks: [{ applianceId: "ac", variantId: "ac-1.5", count: 1, isInverter: true }], backupHours: 4 },
      catalog,
    );
    // running 1100, surge skipped for inverter-tagged AC: (1100 + 0) × 1.20 = 1320W → 1.5kW @ 12V.
    expect(r.inverterKw).toBe(1.5);
    expect(r.systemVoltage).toBe(12);
    expect(r.tooLarge).toBe(false);
  });

  it("inverter AC + fridge + 5 LEDs, 4h → 3kW (was 5kW)", () => {
    const r = calculateSizing(
      {
        picks: [
          { applianceId: "ac",     variantId: "ac-1.5",   count: 1, isInverter: true },
          { applianceId: "fridge", variantId: "fridge-m", count: 1 },
          { applianceId: "led",    variantId: "led-9",    count: 5 },
        ],
        backupHours: 4,
      },
      catalog,
    );
    // running: 1295W (unchanged)
    // surge_extra: AC skipped (inverter), fridge = 750W (highest remaining inductive)
    // required: (1295 + 750) × 1.20 = 2454W → 3kW @ 24V.
    expect(r.inverterKw).toBe(3);
    expect(r.systemVoltage).toBe(24);
    expect(r.totalRunningWatts).toBe(1295);
    expect(r.tooLarge).toBe(false);
  });
});

describe("estimatePriceEgp", () => {
  it("3kW inverter + 1× 200Ah at 24V, mid-tier pricing", () => {
    const r = estimatePriceEgp(3, 1, 200, 24, {
      inverter_egp_per_kw_min: 4500,
      inverter_egp_per_kw_max: 7500,
      battery_egp_per_wh_min: 12,
      battery_egp_per_wh_max: 18,
    });
    // inverter: 3 × 4500..7500 = 13500..22500
    // battery: 200×24 = 4800Wh × 12..18 = 57600..86400
    // total: 71100..108900 → rounded to nearest 1000
    expect(r.min).toBe(71000);
    expect(r.max).toBe(109000);
  });
});
