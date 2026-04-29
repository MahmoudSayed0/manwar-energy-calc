import { Card } from "@/components/ui/card";
import { Battery, Zap, ShieldCheck, Plug, Lightbulb, Check, X, Wallet } from "lucide-react";

interface Props {
  watts: number;
  hours: number;
  priceMin: number;
  priceMax: number;
  locale: "ar" | "en";
}

// Egypt residential electricity assumptions (April 2026, mid-tier average).
const EGP_PER_KWH = 1.45;
const HORIZON_YEARS = 5;
const BATTERY_LIFE_YEARS = 8;

function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}

export function CostComparisonCard({ watts, hours, priceMin, priceMax, locale }: Props) {
  const isAr = locale === "ar";

  const dailyKWh = (watts / 1000) * hours;
  const monthlyKWh = dailyKWh * 30;
  const yearlyKWh = dailyKWh * 365;

  const monthlyBill = monthlyKWh * EGP_PER_KWH;
  const yearlyBill = yearlyKWh * EGP_PER_KWH;
  const fiveYearBill = yearlyBill * HORIZON_YEARS;

  const batteryMid = (priceMin + priceMax) / 2;
  const ratio = fiveYearBill > 0 ? batteryMid / fiveYearBill : 0;

  const t = isAr
    ? {
        eyebrow: "هل البطارية بتوفر فلوس؟",
        title: "البطارية ولا فاتورة الكهربا؟",
        body: "بنقارن سعر نظام البطارية بفاتورة الكهربا اللي هتدفعها لتشغيل نفس الأجهزة خلال ساعات القطع.",
        battery_badge: "موثوقية",
        battery_label: "نظام البطارية",
        battery_sub: "دفعة واحدة · بيدوم 8 سنين",
        bills_badge: "الكهربا نفسها",
        bills_label: "فاتورة الكهربا",
        bills_sub: `إجمالي ${HORIZON_YEARS} سنين`,
        per_month: "في الشهر",
        per_year: "في السنة",
        kwh: "ك.و.س",
        battery_pros: [
          "بتشغل بيتك وقت قطع الكهربا",
          "صامت وبيشتغل فوري",
          `بيدوم حوالي ${BATTERY_LIFE_YEARS} سنين`,
          "مفيش عوادم ولا ضوضاء",
        ],
        bills_points: [
          { good: true, text: "مفيش تكلفة دفعة واحدة كبيرة" },
          { good: false, text: "لما الكهربا تقطع، الأجهزة بتقف" },
          { good: false, text: "أكل التلاجة بيخرب وقت القطع الطويل" },
          { good: false, text: "صعب تشتغل أو تذاكر وقت القطع" },
        ],
        verdict_title: "الخلاصة",
        verdict_body: `البطارية مش أرخص من الكهربا. الأجهزة دي بتاكل ${fmt(fiveYearBill)} جنيه كهربا على ${HORIZON_YEARS} سنين. البطارية أغلى، بس بتضمنلك الأجهزة دي تكمل شغالة لما الكهربا تقطع.`,
        ratio_label: "البطارية أغلى بحوالي",
        times: "ضعف",
      }
    : {
        eyebrow: "Does the battery save money?",
        title: "Battery vs. electricity bills",
        body: "Comparing the battery system to the electricity bills you'd pay to run the same appliances during your outage hours.",
        battery_badge: "Reliability",
        battery_label: "Battery system",
        battery_sub: `One-time · lasts ${BATTERY_LIFE_YEARS} years`,
        bills_badge: "Energy itself",
        bills_label: "Electricity bills",
        bills_sub: `${HORIZON_YEARS}-year total`,
        per_month: "per month",
        per_year: "per year",
        kwh: "kWh",
        battery_pros: [
          "Keeps your home running during outages",
          "Silent, instant, no fumes",
          `Lasts about ${BATTERY_LIFE_YEARS} years`,
          "Zero noise, zero pollution",
        ],
        bills_points: [
          { good: true, text: "No big upfront cost" },
          { good: false, text: "When the grid cuts, your appliances stop" },
          { good: false, text: "Food spoils during long outages" },
          { good: false, text: "Hard to work or cool down during cuts" },
        ],
        verdict_title: "Bottom line",
        verdict_body: `The battery isn't cheaper than electricity. These appliances use about ${fmt(fiveYearBill)} EGP of grid power over ${HORIZON_YEARS} years. The battery costs more — but it's what keeps them running when the grid is down.`,
        ratio_label: "Battery is roughly",
        times: "× more",
      };

  return (
    <Card className="overflow-hidden p-5 md:p-6 space-y-5 bg-card border-border shadow-sm">
      <header className="space-y-1.5">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-[0.18em]">{t.eyebrow}</p>
        <h3 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">{t.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{t.body}</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {/* BATTERY column — primary tinted */}
        <div className="rounded-2xl border-2 border-primary bg-primary/5 p-4 space-y-3 relative">
          <span className="absolute -top-2 start-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider">
            <ShieldCheck className="h-2.5 w-2.5" />
            {t.battery_badge}
          </span>
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Battery className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{t.battery_label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{t.battery_sub}</p>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-extrabold tabular-nums leading-tight">
            {fmt(priceMin)}
            <span className="text-xs font-medium opacity-70 mx-1">–</span>
            {fmt(priceMax)}
            <span className="text-[10px] font-medium opacity-70 ms-1">EGP</span>
          </p>
          <ul className="space-y-1.5 text-[11px] leading-snug">
            {t.battery_pros.map((p, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Check className="h-3 w-3 text-success shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* BILLS column — neutral */}
        <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3 relative">
          <span className="absolute -top-2 start-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground text-[9px] font-bold uppercase tracking-wider">
            <Plug className="h-2.5 w-2.5" />
            {t.bills_badge}
          </span>
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15 text-warning">
              <Wallet className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{t.bills_label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{t.bills_sub}</p>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-extrabold tabular-nums leading-tight">
            {fmt(fiveYearBill)}
            <span className="text-[10px] font-medium opacity-70 ms-1">EGP</span>
          </p>
          <ul className="space-y-1 text-[10px] tabular-nums text-muted-foreground border-t border-border pt-2">
            <li className="flex justify-between gap-1">
              <span>{t.per_month}</span>
              <span className="font-semibold text-foreground">{fmt(monthlyBill)}</span>
            </li>
            <li className="flex justify-between gap-1">
              <span>{t.per_year}</span>
              <span className="font-semibold text-foreground">{fmt(yearlyBill)}</span>
            </li>
            <li className="flex justify-between gap-1">
              <span>{Math.round(yearlyKWh).toLocaleString()} {t.kwh}/year</span>
              <span className="font-semibold text-foreground">@ {EGP_PER_KWH}</span>
            </li>
          </ul>
          <ul className="space-y-1.5 text-[11px] leading-snug">
            {t.bills_points.map((p, i) => (
              <li key={i} className="flex items-start gap-1.5">
                {p.good
                  ? <Check className="h-3 w-3 text-success shrink-0 mt-0.5" />
                  : <X className="h-3 w-3 text-destructive shrink-0 mt-0.5" />}
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary/8 to-primary/4 border border-primary/20 p-4 md:p-5 flex items-start gap-3">
        <span className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
          <Lightbulb className="h-5 w-5" />
        </span>
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{t.verdict_title}</p>
            {ratio > 1 && (
              <span className="text-[10px] text-muted-foreground tabular-nums">
                · {t.ratio_label} <span className="font-bold text-foreground">{ratio.toFixed(1)}{t.times}</span>
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed">{t.verdict_body}</p>
        </div>
      </div>
    </Card>
  );
}
