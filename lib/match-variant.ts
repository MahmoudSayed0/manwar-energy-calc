import type { Appliance, ApplianceVariant } from "./types";

/**
 * Pulls a plain-watt reading out of OCR text from an appliance nameplate.
 * Matches "150W", "150 W", "150 Watts" but explicitly excludes kW and kWh.
 * Filters to a sane residential range (5–15000 W) so OCR noise doesn't return giant numbers.
 * Returns the largest reasonable match (the rated wattage is usually the most prominent figure).
 */
export function extractWatts(text: string): number | null {
  const re = /(?<![kK])(\d{1,5})\s*W(?:atts?)?\b(?!h)/gi;
  const matches = [...text.matchAll(re)];
  if (matches.length === 0) return null;

  const candidates = matches
    .map(m => parseInt(m[1], 10))
    .filter(n => Number.isFinite(n) && n >= 5 && n <= 15000);

  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

export interface VariantMatch {
  appliance: Appliance;
  variant: ApplianceVariant;
  diffWatts: number;
  diffRatio: number;
}

/**
 * Finds the catalog variant whose running watts is closest to the target.
 * Returns null if no variant is within 30% of the target (the OCR was probably wrong
 * or the appliance isn't in our catalog at all).
 */
export function findClosestVariant(
  targetWatts: number,
  catalog: Appliance[],
  tolerance = 0.3,
): VariantMatch | null {
  let best: VariantMatch | null = null;

  for (const appl of catalog) {
    for (const variant of appl.variants) {
      const diff = Math.abs(variant.running_watts - targetWatts);
      const ratio = targetWatts > 0 ? diff / targetWatts : Infinity;
      if (!best || diff < best.diffWatts) {
        best = { appliance: appl, variant, diffWatts: diff, diffRatio: ratio };
      }
    }
  }

  if (!best || best.diffRatio > tolerance) return null;
  return best;
}
