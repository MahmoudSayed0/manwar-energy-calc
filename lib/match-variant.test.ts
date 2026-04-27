import { describe, it, expect } from "vitest";
import { extractWatts, extractOrCalculateWatts, findClosestVariant } from "./match-variant";
import type { Appliance } from "./types";

describe("extractWatts", () => {
  it("extracts plain watts", () => {
    expect(extractWatts("150W")).toBe(150);
    expect(extractWatts("150 W")).toBe(150);
    expect(extractWatts("150 Watts")).toBe(150);
    expect(extractWatts("150 watt")).toBe(150);
  });

  it("ignores kW and kWh prefixes/suffixes", () => {
    expect(extractWatts("3kW")).toBe(null);
    expect(extractWatts("3 kW")).toBe(null);
    expect(extractWatts("180 kWh/year")).toBe(null);
  });

  it("extracts watts from a realistic nameplate string", () => {
    expect(extractWatts("220V 50Hz 150W 0.7A Made in Korea")).toBe(150);
  });

  it("picks the largest reasonable value when multiple are present", () => {
    expect(extractWatts("idle 5W max 800W startup 2400W")).toBe(2400);
  });

  it("filters out values outside the residential range", () => {
    expect(extractWatts("Model 3W only")).toBe(null);
    expect(extractWatts("rated 50000W")).toBe(null);
  });

  it("returns null when no watt reading is present", () => {
    expect(extractWatts("LG Refrigerator Model XYZ")).toBe(null);
    expect(extractWatts("")).toBe(null);
  });
});

const catalog: Appliance[] = [
  {
    id: "tv", slug: "tv", name_ar: "تلفزيون", name_en: "TV",
    category: "media", inductive: false, icon: "tv",
    variants: [
      { id: "tv32", variant_label_ar: "32", variant_label_en: "32\"", running_watts: 60, surge_watts: 60 },
      { id: "tv55", variant_label_ar: "55", variant_label_en: "55\"", running_watts: 110, surge_watts: 110 },
    ],
  },
  {
    id: "led", slug: "led-bulb", name_ar: "لمبة", name_en: "LED",
    category: "lighting", inductive: false, icon: "lightbulb",
    variants: [
      { id: "led9", variant_label_ar: "9 وات", variant_label_en: "9W", running_watts: 9, surge_watts: 9 },
    ],
  },
  {
    id: "ac", slug: "split-ac", name_ar: "تكييف", name_en: "AC",
    category: "cooling", inductive: true, icon: "air-vent",
    variants: [
      { id: "ac1.5", variant_label_ar: "1.5 حصان", variant_label_en: "1.5 HP", running_watts: 1100, surge_watts: 3300 },
    ],
  },
];

describe("extractOrCalculateWatts", () => {
  it("prefers a direct watt reading", () => {
    expect(extractOrCalculateWatts("220V 50Hz 150W 0.7A")).toEqual({ watts: 150, method: "direct" });
  });

  it("computes from V x A when watts are missing", () => {
    expect(extractOrCalculateWatts("220V 0.7A")).toEqual({ watts: 154, method: "computed" });
    expect(extractOrCalculateWatts("INPUT 230V  1.5A 50Hz")).toEqual({ watts: 345, method: "computed" });
  });

  it("rejects unreasonable computed values", () => {
    expect(extractOrCalculateWatts("12V 0.1A")).toBe(null);          // 1.2W too small
    expect(extractOrCalculateWatts("50V 200A")).toBe(null);          // out of mains range (50V)
    expect(extractOrCalculateWatts("220V 0.001A")).toBe(null);       // 0.22W too small
  });

  it("returns null when no useful values are present", () => {
    expect(extractOrCalculateWatts("Model XYZ Made in China")).toBe(null);
    expect(extractOrCalculateWatts("")).toBe(null);
  });
});

describe("findClosestVariant", () => {
  it("finds an exact match", () => {
    const m = findClosestVariant(60, catalog);
    expect(m?.appliance.id).toBe("tv");
    expect(m?.variant.id).toBe("tv32");
  });

  it("finds a close match within tolerance", () => {
    const m = findClosestVariant(115, catalog);
    expect(m?.variant.id).toBe("tv55");
  });

  it("returns null when nothing is within tolerance", () => {
    expect(findClosestVariant(5000, catalog)).toBe(null);
  });

  it("matches a small wattage to the LED bulb", () => {
    const m = findClosestVariant(10, catalog);
    expect(m?.appliance.id).toBe("led");
  });

  it("matches a high wattage to the AC", () => {
    const m = findClosestVariant(1200, catalog);
    expect(m?.appliance.id).toBe("ac");
  });

  it("respects a custom tolerance", () => {
    expect(findClosestVariant(80, catalog, 0.1)).toBe(null);    // 80W only ~25% from 60W
    expect(findClosestVariant(80, catalog, 0.5)).not.toBe(null); // wider tolerance accepts it
  });
});
