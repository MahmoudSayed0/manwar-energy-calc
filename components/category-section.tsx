"use client";

import type { Appliance, AppliancePick } from "@/lib/types";
import { ApplianceCard } from "./appliance-card";

interface Props {
  appliances: Appliance[];
  picks: AppliancePick[];
  locale: "ar" | "en";
  onPicksChange: (picks: AppliancePick[]) => void;
}

export function CategorySection({ appliances, picks, locale, onPicksChange }: Props) {
  if (appliances.length === 0) return null;

  function update(id: string, next: AppliancePick | null) {
    const without = picks.filter(p => p.applianceId !== id);
    onPicksChange(next ? [...without, next] : without);
  }

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-10">
      {appliances.map(a => (
        <ApplianceCard
          key={a.id}
          appliance={a}
          pick={picks.find(p => p.applianceId === a.id)}
          locale={locale}
          onChange={(p) => update(a.id, p)}
        />
      ))}
    </div>
  );
}
