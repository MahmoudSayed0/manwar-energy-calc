import { Card } from "@/components/ui/card";
import { AnkhLogo } from "./ankh-logo";
import { Battery, Zap, ShieldCheck, Wrench, CircleDollarSign } from "lucide-react";

interface Props {
  inverterKw: number;
  systemVoltage: number;
  batteryQty: number;
  batteryAh: number;
  priceMin: number;
  priceMax: number;
  hours: number;
  locale: "ar" | "en";
}

const INVERTER_PRICE_PER_KW_MIN = 4500;
const INVERTER_PRICE_PER_KW_MAX = 7500;
const BATTERY_PRICE_PER_WH_MIN = 12;
const BATTERY_PRICE_PER_WH_MAX = 18;

function fmt(n: number): string {
  return n.toLocaleString();
}

export function ResultCard({ inverterKw, systemVoltage, batteryQty, batteryAh, priceMin, priceMax, hours, locale }: Props) {
  const t = locale === "ar"
    ? {
      need: "محتاج",
      inverter: "إنفرتر",
      batteries: batteryQty === 1 ? "بطارية" : "بطاريات",
      at: "على",
      priceLabel: "السعر التقديري الإجمالي",
      egp: "ج.م",
      forH: "لتغطية",
      h: "ساعة قطع",
      chemistry: "ليثيوم",
      breakdownTitle: "تفاصيل التكلفة التقديرية",
      inverterCost: "الإنفرتر",
      batteryCost: "البطاريات",
      whatsIncluded: "السعر بيشمل",
      included_inverter: "إنفرتر بحجم مناسب لقدرة بيتك",
      included_battery: "بطاريات ليثيوم بسعة مناسبة لساعات التشغيل",
      included_install: "تركيب أساسي وأسلاك توصيل",
      included_warranty: "ضمان من المورد (يختلف من محل لمحل)",
      notesTitle: "النظام بيعمل إيه؟",
      note_battery: "البطارية: بتخزن الطاقة. كل ما زادت السعة، زادت ساعات التشغيل.",
      note_inverter: "الإنفرتر: بيحول الكهرباء من البطارية للأجهزة. حجمه على أساس قدرة أجهزتك.",
      note_cost: "الساعات بتأثر على سعر البطارية. سعر الإنفرتر بيفضل تقريباً ثابت.",
    }
    : {
      need: "You need",
      inverter: "kW inverter",
      batteries: batteryQty === 1 ? "battery" : "batteries",
      at: "@",
      priceLabel: "Total estimated price",
      egp: "EGP",
      forH: "to cover",
      h: "hours of outage",
      chemistry: "Lithium",
      breakdownTitle: "Estimate breakdown",
      inverterCost: "Inverter",
      batteryCost: "Batteries",
      whatsIncluded: "Price includes",
      included_inverter: "Inverter sized for your home's load",
      included_battery: "Lithium batteries sized for your backup hours",
      included_install: "Basic installation and wiring",
      included_warranty: "Supplier warranty (varies by shop)",
      notesTitle: "How this system works",
      note_battery: "Battery: stores the energy. More capacity = more backup hours.",
      note_inverter: "Inverter: turns battery DC into wall AC. Sized to your peak load.",
      note_cost: "Hours mostly affect battery cost. Inverter cost stays roughly the same.",
    };

  const inverterMin = inverterKw * INVERTER_PRICE_PER_KW_MIN;
  const inverterMax = inverterKw * INVERTER_PRICE_PER_KW_MAX;
  const totalBatteryWh = batteryQty * batteryAh * systemVoltage;
  const batteryMin = totalBatteryWh * BATTERY_PRICE_PER_WH_MIN;
  const batteryMax = totalBatteryWh * BATTERY_PRICE_PER_WH_MAX;

  const inverterShare = priceMin + priceMax > 0 ? Math.round(((inverterMin + inverterMax) / (priceMin + priceMax + inverterMin + inverterMax - (priceMin + priceMax))) * 100) : 0;
  const _ = inverterShare; // suppress unused if linter complains

  const inverterAvg = (inverterMin + inverterMax) / 2;
  const batteryAvg = (batteryMin + batteryMax) / 2;
  const totalAvg = inverterAvg + batteryAvg;
  const inverterPct = totalAvg > 0 ? Math.round((inverterAvg / totalAvg) * 100) : 0;
  const batteryPct = totalAvg > 0 ? Math.round((batteryAvg / totalAvg) * 100) : 0;

  return (
    <Card className="p-8 md:p-10 space-y-8 bg-gradient-to-br from-primary to-[hsl(var(--primary-dark))] text-primary-foreground border-0 shadow-lg">


      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{t.need}</p>
        <p className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight flex items-center gap-3 flex-wrap">
          <Zap className="h-9 w-9 md:h-11 md:w-11 opacity-80" />
          <span>{inverterKw} {t.inverter}</span>
        </p>
        <p className="text-2xl md:text-3xl font-semibold opacity-95 flex items-center gap-3 flex-wrap">
          <Battery className="h-7 w-7 opacity-80" />
          <span>{batteryQty}× {batteryAh}Ah {t.batteries} {t.at} {systemVoltage}V</span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/20 uppercase tracking-[0.14em]">
            {t.chemistry}
          </span>
        </p>
      </div>

      <div className="border-t border-white/15 pt-6">
        <p className="text-xs uppercase tracking-[0.18em] opacity-70 mb-2">{t.priceLabel}</p>
        <p className="text-3xl md:text-4xl font-extrabold tabular-nums">
          {fmt(priceMin)} – {fmt(priceMax)} <span className="text-base font-medium opacity-85">{t.egp}</span>
        </p>
      </div>

      <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{t.breakdownTitle}</p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 opacity-80" />
                <span className="font-medium">{t.inverterCost}</span>
                <span className="opacity-70 text-xs">({inverterKw} kW)</span>
              </span>
              <span className="font-semibold tabular-nums">{fmt(Math.round(inverterMin / 1000) * 1000)} – {fmt(Math.round(inverterMax / 1000) * 1000)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-white/70" style={{ width: `${inverterPct}%` }} />
            </div>
            <p className="text-[10px] opacity-60 tabular-nums">{inverterPct}% {locale === "ar" ? "من التكلفة" : "of total"}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Battery className="h-4 w-4 opacity-80" />
                <span className="font-medium">{t.batteryCost}</span>
                <span className="opacity-70 text-xs">({(totalBatteryWh / 1000).toFixed(1)} kWh)</span>
              </span>
              <span className="font-semibold tabular-nums">{fmt(Math.round(batteryMin / 1000) * 1000)} – {fmt(Math.round(batteryMax / 1000) * 1000)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-white/70" style={{ width: `${batteryPct}%` }} />
            </div>
            <p className="text-[10px] opacity-60 tabular-nums">{batteryPct}% {locale === "ar" ? "من التكلفة" : "of total"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{t.notesTitle}</p>
        <ul className="space-y-2.5 text-sm leading-relaxed">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 shrink-0">
              <Battery className="h-3.5 w-3.5" />
            </span>
            <span>{t.note_battery}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 shrink-0">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <span>{t.note_inverter}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 shrink-0">
              <CircleDollarSign className="h-3.5 w-3.5" />
            </span>
            <span>{t.note_cost}</span>
          </li>
        </ul>
      </div>

      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{t.whatsIncluded}</p>
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-start gap-2"><Zap className="h-4 w-4 opacity-70 shrink-0 mt-0.5" /><span>{t.included_inverter}</span></li>
          <li className="flex items-start gap-2"><Battery className="h-4 w-4 opacity-70 shrink-0 mt-0.5" /><span>{t.included_battery}</span></li>
          <li className="flex items-start gap-2"><Wrench className="h-4 w-4 opacity-70 shrink-0 mt-0.5" /><span>{t.included_install}</span></li>
          <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 opacity-70 shrink-0 mt-0.5" /><span>{t.included_warranty}</span></li>
        </ul>
      </div>

      <p className="text-sm text-black pt-2 text-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm text-sm">{t.forH} <strong>{hours}</strong>  {t.h}</p>
    </Card>
  );
}
