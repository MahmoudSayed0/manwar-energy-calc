export interface PricingTier {
  inverter_egp_per_kw_min: number;
  inverter_egp_per_kw_max: number;
  battery_egp_per_wh_min: number;
  battery_egp_per_wh_max: number;
}

export function estimatePriceEgp(
  inverterKw: number,
  batteryQty: number,
  ahEach: number,
  systemVoltage: number,
  pricing: PricingTier,
): { min: number; max: number } {
  const inverterMin = inverterKw * pricing.inverter_egp_per_kw_min;
  const inverterMax = inverterKw * pricing.inverter_egp_per_kw_max;
  const totalWh = batteryQty * ahEach * systemVoltage;
  const batteryMin = totalWh * pricing.battery_egp_per_wh_min;
  const batteryMax = totalWh * pricing.battery_egp_per_wh_max;
  return {
    min: Math.round((inverterMin + batteryMin) / 1000) * 1000,
    max: Math.round((inverterMax + batteryMax) / 1000) * 1000,
  };
}
