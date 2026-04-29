import { Card } from "@/components/ui/card";
import { Battery, Fuel, Volume2, VolumeX, Zap, Wrench, Leaf, Wind, Check, X, TrendingDown } from "lucide-react";

interface Props {
  watts: number;
  hours: number;
  priceMin: number;
  priceMax: number;
  locale: "ar" | "en";
}

// Egypt-market assumptions (April 2026, conservative).
const FUEL_EGP_PER_LITER = 14;             // gasoline/diesel mid price
const GEN_EFFICIENCY_L_PER_KWH = 0.5;       // small portable, half-load
const MAINTENANCE_RATIO = 0.10;             // 10% of fuel cost annually
const HORIZON_YEARS = 5;
const BATTERY_LIFE_YEARS = 8;               // typical lithium

function generatorUnitCost(watts: number): number {
  if (watts <= 2000) return 12000;
  if (watts <= 4000) return 18000;
  if (watts <= 6000) return 25000;
  return 35000;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}

export function CostComparisonCard({ watts, hours, priceMin, priceMax, locale }: Props) {
  const isAr = locale === "ar";

  const dailyKWh = (watts / 1000) * hours;
  const dailyLiters = dailyKWh * GEN_EFFICIENCY_L_PER_KWH;
  const monthlyFuel = dailyLiters * 30 * FUEL_EGP_PER_LITER;
  const yearlyFuel = monthlyFuel * 12;
  const yearlyMaintenance = yearlyFuel * MAINTENANCE_RATIO;
  const yearlyOngoing = yearlyFuel + yearlyMaintenance;

  const generatorUnit = generatorUnitCost(watts);
  const generator5y = generatorUnit + yearlyOngoing * HORIZON_YEARS;

  const batteryMid = (priceMin + priceMax) / 2;
  const savings = generator5y - batteryMid;
  const batteryWins = savings > 0;

  const t = isAr
    ? {
        title: "البطارية ولا الموتور؟",
        subtitle: `مقارنة على ${HORIZON_YEARS} سنين`,
        battery_label: "نظام البطارية",
        battery_sub: "دفعة واحدة",
        gen_label: "موتور كهربا",
        gen_sub: `تكلفة ${HORIZON_YEARS} سنين`,
        horizon_note: `بناءً على استهلاكك (${watts.toLocaleString()} وات لـ ${hours} ساعات يوميًا).`,
        battery_pros: [
          "صامت تمامًا — مفيش صوت موتور",
          "بيشتغل فوري لما الكهربا تقطع",
          `عمره ${BATTERY_LIFE_YEARS} سنين تقريبًا`,
          "مفيش عوادم ولا دخان",
          "صيانة قليلة جدًا",
        ],
        gen_cons: [
          "صوت موتور عالي وقت التشغيل",
          "بياخد ثواني عشان يشتغل بعد القطع",
          "بنزين/سولار لازم تجدده باستمرار",
          "عوادم ودخان وتلوث",
          "تغيير زيت وفلتر كل فترة",
        ],
        verdict_save: `البطارية بتوفرلك حوالي ${fmt(Math.abs(savings))} جنيه على ${HORIZON_YEARS} سنين، وكمان تفضل ساكن من غير صوت ولا تلوث.`,
        verdict_costlier: `الموتور أرخص بحوالي ${fmt(Math.abs(savings))} جنيه على ${HORIZON_YEARS} سنين، بس هتعيش مع الصوت والعوادم.`,
        gen_unit_label: "تكلفة الموتور",
        gen_fuel_label: "بنزين/سولار سنوي",
        gen_maint_label: "صيانة سنوية",
        gen_total_label: `الإجمالي على ${HORIZON_YEARS} سنين`,
        battery_total_label: "تكلفة دلوقتي",
        savings_label: "الفرق",
        eco_label: "صديق البيئة",
      }
    : {
        title: "Battery vs Generator",
        subtitle: `${HORIZON_YEARS}-year comparison`,
        battery_label: "Battery system",
        battery_sub: "one-time",
        gen_label: "Petrol generator",
        gen_sub: `${HORIZON_YEARS}-year cost`,
        horizon_note: `Based on your load (${watts.toLocaleString()} W for ${hours} h/day).`,
        battery_pros: [
          "Completely silent — no engine noise",
          "Switches on instantly during outages",
          `Lasts about ${BATTERY_LIFE_YEARS} years`,
          "No exhaust, no fumes",
          "Very low maintenance",
        ],
        gen_cons: [
          "Loud engine noise during use",
          "Takes seconds to start after a cut",
          "Constant refueling at the pump",
          "Exhaust, fumes, and pollution",
          "Oil & filter changes every few months",
        ],
        verdict_save: `The battery saves you about ${fmt(Math.abs(savings))} EGP over ${HORIZON_YEARS} years — plus quiet nights and no fumes.`,
        verdict_costlier: `The generator is roughly ${fmt(Math.abs(savings))} EGP cheaper over ${HORIZON_YEARS} years, but you'll live with the noise and fumes.`,
        gen_unit_label: "Generator unit",
        gen_fuel_label: "Fuel / year",
        gen_maint_label: "Maintenance / year",
        gen_total_label: `Total over ${HORIZON_YEARS} years`,
        battery_total_label: "Cost today",
        savings_label: "Difference",
        eco_label: "Eco-friendly",
      };

  return (
    <Card className="relative overflow-hidden p-6 md:p-7 space-y-6 bg-card border-border">
      <header className="space-y-1">
        <p className="text-xs font-semibold text-primary uppercase tracking-[0.16em]">{t.subtitle}</p>
        <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">{t.title}</h3>
        <p className="text-xs text-muted-foreground">{t.horizon_note}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {/* BATTERY column */}
        <div className="rounded-2xl border-2 border-primary bg-primary/5 p-4 md:p-5 space-y-3 relative">
          <span className="absolute -top-2 start-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
            <Leaf className="h-3 w-3" />
            {t.eco_label}
          </span>
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Battery className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold">{t.battery_label}</p>
              <p className="text-[10px] text-muted-foreground">{t.battery_sub}</p>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold tabular-nums leading-tight">
            {fmt(priceMin)}<span className="text-sm font-medium opacity-70"> – </span>{fmt(priceMax)}
            <span className="text-xs font-medium opacity-70 ms-1">EGP</span>
          </p>
          <ul className="space-y-1.5 text-[11px] md:text-xs leading-snug">
            {t.battery_pros.map((p, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Check className="h-3 w-3 text-success shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* GENERATOR column */}
        <div className="rounded-2xl border border-border bg-muted/40 p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15 text-warning">
              <Fuel className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold">{t.gen_label}</p>
              <p className="text-[10px] text-muted-foreground">{t.gen_sub}</p>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold tabular-nums leading-tight">
            {fmt(generator5y)}
            <span className="text-xs font-medium opacity-70 ms-1">EGP</span>
          </p>
          <ul className="space-y-1 text-[10px] md:text-[11px] tabular-nums text-muted-foreground">
            <li className="flex justify-between"><span>{t.gen_unit_label}</span><span>{fmt(generatorUnit)}</span></li>
            <li className="flex justify-between"><span>{t.gen_fuel_label}</span><span>{fmt(yearlyFuel)}</span></li>
            <li className="flex justify-between"><span>{t.gen_maint_label}</span><span>{fmt(yearlyMaintenance)}</span></li>
          </ul>
          <ul className="space-y-1.5 text-[11px] md:text-xs leading-snug pt-1 border-t border-border">
            {t.gen_cons.map((c, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <X className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className={`rounded-2xl p-4 md:p-5 flex items-start gap-3 ${
          batteryWins ? "bg-success/10 border border-success/30" : "bg-warning/10 border border-warning/30"
        }`}
      >
        <span
          className={`shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl ${
            batteryWins ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
          }`}
        >
          {batteryWins ? <TrendingDown className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
        </span>
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em]">{t.savings_label}</p>
          <p className="text-sm md:text-base font-medium leading-relaxed">
            {batteryWins ? t.verdict_save : t.verdict_costlier}
          </p>
        </div>
      </div>
    </Card>
  );
}
