"use client";

import { useMemo } from "react";
import { Sparkles, Battery, Zap, CircleDollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { calculateSizing } from "@/lib/sizing";
import { estimatePriceEgp, type PricingTier } from "@/lib/price-estimate";
import type { Appliance, AppliancePick } from "@/lib/types";

interface Props {
  catalog: Appliance[];
  picks: AppliancePick[];
  hours: number;
  pricing: PricingTier;
  locale: "ar" | "en";
}

export function LiveCalcCard({ catalog, picks, hours, pricing, locale }: Props) {
  const result = useMemo(() => {
    if (picks.length === 0) return null;
    try {
      const r = calculateSizing({ picks, backupHours: hours }, catalog);
      if (r.tooLarge) return { tooLarge: true as const };
      const price = estimatePriceEgp(r.inverterKw, r.battery.qty, r.battery.ahEach, r.systemVoltage, pricing);
      return { ...r, price, tooLarge: false as const };
    } catch {
      return null;
    }
  }, [catalog, picks, hours, pricing]);

  const t = locale === "ar"
    ? {
      you_need: "محتاج",
      inverter: "إنفرتر",
      at: "على",
      battery: "بطارية",
      batteries: "بطاريات",
      price_label: "السعر التقديري",
      egp: "ج.م",
      per_h: "لتغطية",
      h: "ساعة قطع",
      chemistry: "ليثيوم",
      empty_title: "اختار أجهزتك تحت",
      empty_body: "هتشوف هنا الإنفرتر والبطاريات اللي محتاجها وأنت بتختار.",
      too_large_title: "حمل كبير",
      too_large_body: "احتياجك أكبر من نطاق الحاسبة. كلم مهندس مرخص.",
      notes_title: "النظام بيعمل إيه؟",
      note_battery: "البطارية: بتخزن الطاقة. كل ما زادت السعة، زادت ساعات التشغيل.",
      note_inverter: "الإنفرتر: بيحول الكهرباء من البطارية للأجهزة. حجمه على أساس قدرة أجهزتك.",
      note_cost: "الساعات بتأثر على سعر البطارية. سعر الإنفرتر بيفضل تقريباً ثابت.",
    }
    : {
      you_need: "You need",
      inverter: "kW inverter",
      at: "@",
      battery: "battery",
      batteries: "batteries",
      price_label: "Estimated price",
      egp: "EGP",
      per_h: "to cover",
      h: "hours of outage",
      chemistry: "Lithium",
      empty_title: "Pick appliances below",
      empty_body: "Your inverter and battery sizing will appear here as you pick.",
      too_large_title: "Load is too large",
      too_large_body: "This is beyond the calculator's range. Talk to a licensed engineer.",
      notes_title: "How this system works",
      note_battery: "Battery: stores the energy. More capacity = more backup hours.",
      note_inverter: "Inverter: turns battery DC into wall AC. Sized to your peak load.",
      note_cost: "Hours mostly affect battery cost. Inverter cost stays roughly the same.",
    };

  if (!result) {
    return (
      <Card className="p-8 space-y-3 bg-secondary/40 border-dashed">
        <Sparkles className="h-7 w-7 text-primary" />
        <h3 className="text-lg font-bold">{t.empty_title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{t.empty_body}</p>
      </Card>
    );
  }

  if (result.tooLarge) {
    return (
      <Card className="p-8 space-y-3 border-warning/30 bg-warning/5">
        <h3 className="text-lg font-bold">{t.too_large_title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{t.too_large_body}</p>
      </Card>
    );
  }

  return (
    <Card className="p-8 space-y-7 bg-gradient-to-br from-primary to-[hsl(var(--primary-dark))] text-primary-foreground border-0 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{t.you_need}</p>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Zap className="h-7 w-7 opacity-80" />
          <span className="text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums">{result.inverterKw}</span>
          <span className="text-xl font-semibold opacity-95">{t.inverter}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Battery className="h-7 w-7 opacity-80" />
          <span className="text-2xl md:text-3xl font-bold tabular-nums">{result.battery.qty}× {result.battery.ahEach}Ah</span>
          <span className="text-base opacity-85">{t.at} {result.systemVoltage}V</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-[0.12em]">
            {t.chemistry}
          </span>
        </div>
      </div>

      <div className="border-t border-white/15 pt-5">
        <p className="text-xs uppercase tracking-[0.18em] opacity-70 mb-2">{t.price_label}</p>
        <p className="text-2xl md:text-3xl font-extrabold tabular-nums">
          {result.price.min.toLocaleString()} – {result.price.max.toLocaleString()}
          <span className="text-sm font-medium opacity-85 ms-2">{t.egp}</span>
        </p>
      </div>

      <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 md:p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{t.notes_title}</p>
        <ul className="space-y-2.5 text-sm leading-relaxed">
          <li className="flex items-start gap-3">
            <Battery className="h-4 w-4 opacity-80 shrink-0 mt-0.5" />
            <span>{t.note_battery}</span>
          </li>
          <li className="flex items-start gap-3">
            <Zap className="h-4 w-4 opacity-80 shrink-0 mt-0.5" />
            <span>{t.note_inverter}</span>
          </li>
          <li className="flex items-start gap-3">
            <CircleDollarSign className="h-4 w-4 opacity-80 shrink-0 mt-0.5" />
            <span>{t.note_cost}</span>
          </li>
        </ul>
      </div>

      <p className="text-sm opacity-75 gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm text-sm">{t.per_h} {hours} {t.h}</p>
    </Card>
  );
}
