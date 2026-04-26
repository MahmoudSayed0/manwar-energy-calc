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
