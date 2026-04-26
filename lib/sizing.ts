import type { Appliance, SizingInput, SizingResult } from "./types";

const STANDARD_INVERTERS_KW = [1, 1.5, 2, 3, 5, 6, 8, 10] as const;
const BATTERY_SIZES_AH = [100, 150, 200, 250] as const;
const SAFETY_MARGIN = 1.20;
const INVERTER_EFFICIENCY = 0.85;
const LITHIUM_DOD = 0.80;

function roundUpInverter(kw: number): number | null {
  for (const s of STANDARD_INVERTERS_KW) if (s >= kw) return s;
  return null;
}

function selectVoltage(kw: number): 12 | 24 | 48 {
  if (kw <= 1.5) return 12;
  if (kw <= 3) return 24;
  return 48;
}

function pickPack(requiredAh: number): { qty: number; ahEach: number } | null {
  for (const ah of BATTERY_SIZES_AH) if (ah >= requiredAh) return { qty: 1, ahEach: ah };
  for (const ah of BATTERY_SIZES_AH) if (2 * ah >= requiredAh) return { qty: 2, ahEach: ah };
  for (const ah of BATTERY_SIZES_AH) if (4 * ah >= requiredAh) return { qty: 4, ahEach: ah };
  return null;
}

export function calculateSizing(input: SizingInput, catalog: Appliance[]): SizingResult {
  if (input.picks.length === 0) throw new Error("No appliances selected");
  if (input.backupHours < 1 || input.backupHours > 12) throw new Error("Backup hours must be 1..12");

  let sumRunningW = 0;
  let maxSurgeExtra = 0;

  for (const pick of input.picks) {
    const appl = catalog.find(a => a.id === pick.applianceId);
    if (!appl) continue;
    const variant = appl.variants.find(v => v.id === pick.variantId);
    if (!variant) continue;

    sumRunningW += variant.running_watts * pick.count;

    if (appl.inductive) {
      const extra = (variant.surge_watts - variant.running_watts) * pick.count;
      if (extra > maxSurgeExtra) maxSurgeExtra = extra;
    }
  }

  const requiredW = (sumRunningW + maxSurgeExtra) * SAFETY_MARGIN;
  const inverterKw = roundUpInverter(requiredW / 1000);

  if (inverterKw === null) {
    return {
      inverterKw: 10,
      systemVoltage: 48,
      battery: { qty: 0, ahEach: 0 },
      totalRunningWatts: sumRunningW,
      estimatedPriceEgp: { min: 0, max: 0 },
      warnings: ["TOO_LARGE"],
      tooLarge: true,
    };
  }

  const systemVoltage = selectVoltage(inverterKw);
  const energyNeededWh = sumRunningW * input.backupHours;
  const requiredWh = energyNeededWh / (INVERTER_EFFICIENCY * LITHIUM_DOD);
  const requiredAh = requiredWh / systemVoltage;
  const battery = pickPack(requiredAh);

  if (battery === null) {
    return {
      inverterKw,
      systemVoltage,
      battery: { qty: 0, ahEach: 0 },
      totalRunningWatts: sumRunningW,
      estimatedPriceEgp: { min: 0, max: 0 },
      warnings: ["TOO_LARGE"],
      tooLarge: true,
    };
  }

  return {
    inverterKw,
    systemVoltage,
    battery,
    totalRunningWatts: sumRunningW,
    estimatedPriceEgp: { min: 0, max: 0 },
    warnings: [],
    tooLarge: false,
  };
}
