"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Battery, Camera, Check, CircleDollarSign, Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { calculateSizing } from "@/lib/sizing";
import { estimatePriceEgp, type PricingTier } from "@/lib/price-estimate";
import type { Appliance, AppliancePick, ApplianceCategory } from "@/lib/types";
import { CategorySection } from "./category-section";
import { HoursPicker } from "./hours-picker";
import { ScanModal } from "./scan-modal";
import { WizardProgress } from "./wizard-progress";

interface Props {
  appliances: Appliance[];
  pricing: PricingTier;
  locale: "ar" | "en";
}

const CATEGORY_STEPS: ApplianceCategory[] = ["cooling", "lighting", "kitchen", "media", "laundry", "other"];
const TRANSITION_MS = 400;
const FINAL_LOADER_TOTAL_MS = 1800;
const FINAL_LOADER_STEP_MS = 600;
const STORAGE_KEY = "manwar:wizard:state";
const STORAGE_VERSION = 1;

interface StepCopy {
  title: string;
  description: string;
}

interface HoursCopy {
  title: string;
  description: string;
  bullets: string[];
}

interface Dictionary {
  steps: { label: string }[];
  category: Record<ApplianceCategory, StepCopy>;
  hours: HoursCopy;
  next: string;
  back: string;
  skip: string;
  submit: string;
  err_fail: string;
  loader_title: string;
  loader_steps: string[];
  summary_count: string;
  summary_watts: string;
  scan_cta: string;
  scan_added: string;
}

function getDict(locale: "ar" | "en"): Dictionary {
  if (locale === "ar") {
    return {
      steps: [
        { label: "تبريد وتكييف" },
        { label: "إضاءة" },
        { label: "مطبخ" },
        { label: "أجهزة وترفيه" },
        { label: "غسيل" },
        { label: "أجهزة أخرى" },
        { label: "ساعات التشغيل" },
      ],
      category: {
        cooling: {
          title: "أجهزة التبريد والتكييف",
          description:
            "التكييفات والمراوح أكتر حاجة بتسحب كهرباء في البيت. اختيارك هنا هو أهم قرار في الحساب. لو ما عندكش حاجة من ده، اضغط \"تخطّي\".",
        },
        lighting: {
          title: "الإضاءة",
          description:
            "اللمبات حاجة بسيطة. لمبات الـ LED بتاكل كهرباء قليلة جدًا، أما اللمبات القديمة (الفلامنت) بتاكل تقريبًا 6 أضعافها لنفس درجة الإضاءة.",
        },
        kitchen: {
          title: "أجهزة المطبخ",
          description:
            "التلاجة شغالة 24 ساعة على مدار اليوم — هي الحمل الثابت الوحيد. باقي أجهزة المطبخ شغالة دقايق قليلة بس بتسحب كهرباء عالية لحظة التشغيل.",
        },
        media: {
          title: "موبايلات وتلفزيونات وأجهزة",
          description:
            "الراوتر، شواحن الموبايل، التلفزيون، اللاب توب — حِمل خفيف وسهل تشغّله طول وقت القطع. اختار اللي بتستخدمه فعلًا.",
        },
        laundry: {
          title: "غسيل",
          description:
            "الغسالة بتسحب كهرباء عالية لحظة ما الموتور بيشتغل. لو الغسالة فيها سخان مدمج، بتاكل أكتر بكتير — وده اختيار منفصل.",
        },
        other: {
          title: "أجهزة تانية",
          description:
            "المكوى والسشوار والمكنسة — استخدامها قصير، بس بتسحب كهرباء عالية. ضيفها لو هتحتاجها وقت قطع الكهربا.",
        },
      },
      hours: {
        title: "محتاج كم ساعة تشغيل وقت قطع الكهرباء؟",
        description:
          "كل ساعة زيادة من البطارية تعني سعة أكبر — يعني تكلفة أعلى. هنحسب البطارية عشان أجهزتك المختارة تشتغل مستمر العدد ده من الساعات وقت القطع.",
        bullets: [
          "البطارية: بتخزن الطاقة. كل ما زادت السعة، زادت ساعات التشغيل.",
          "الإنفرتر: بيحول الكهرباء من البطارية للأجهزة. حجمه على أساس قدرة أجهزتك، مش على أساس الساعات.",
          "الساعات بتأثر على تكلفة البطارية. تكلفة الإنفرتر بتفضل تقريبا ثابتة.",
        ],
      },
      next: "التالي",
      back: "السابق",
      skip: "تخطّي",
      submit: "شوف المحلات والتفاصيل",
      err_fail: "حدث خطأ، حاول تاني",
      loader_title: "ثواني...",
      loader_steps: ["بنحسب احتياج بيتك", "بنحدد حجم الإنفرتر", "بنختار البطاريات والمحلات"],
      summary_count: "جهاز",
      summary_watts: "وات",
      scan_cta: "ادخل بالكاميرا",
      scan_added: "اتضاف للقائمة",
    };
  }
  return {
    steps: [
      { label: "Cooling" },
      { label: "Lighting" },
      { label: "Kitchen" },
      { label: "Media & devices" },
      { label: "Laundry" },
      { label: "Other appliances" },
      { label: "Backup hours" },
    ],
    category: {
      cooling: {
        title: "Cooling appliances",
        description:
          "ACs and fans use the most power in your home — picking the right size here is the biggest decision. If you don't have any, just skip.",
      },
      lighting: {
        title: "Lighting",
        description:
          "Light bulbs are easy. Modern LED bulbs use almost nothing; old incandescent bulbs use about 6× more for the same light.",
      },
      kitchen: {
        title: "Kitchen",
        description:
          "Your fridge runs 24/7 — it's the one constant load. Other kitchen items run for short bursts but spike high when they start.",
      },
      media: {
        title: "Phones, TVs & devices",
        description:
          "Routers, phone chargers, TVs, laptops — light load, easy to keep alive. Pick whatever you actually use during outages.",
      },
      laundry: {
        title: "Laundry",
        description:
          "Washers spike hard when the motor starts. If your washer has a built-in heater, it pulls a lot more — that's a separate option.",
      },
      other: {
        title: "Other appliances",
        description:
          "Iron, hair dryer, vacuum — short use, but they spike high. Add them if you'll need them during a power cut.",
      },
    },
    hours: {
      title: "How many hours of backup do you need?",
      description:
        "Each extra hour of backup adds battery capacity. More hours means a bigger battery — and yes, more cost. We size the battery so all your selected appliances keep running for this many hours during a power cut.",
      bullets: [
        "Battery: stores the energy. Bigger = longer backup.",
        "Inverter: turns battery DC into wall AC. Sized to handle your peak load, regardless of hours.",
        "Hours mainly affect battery cost. The inverter cost stays roughly the same.",
      ],
    },
    next: "Next",
    back: "Back",
    skip: "Skip",
    submit: "See shops & details",
    err_fail: "Something went wrong, try again",
    loader_title: "Hold on a second...",
    loader_steps: ["Crunching your home's load", "Sizing the inverter", "Picking batteries & shops"],
    summary_count: "items",
    summary_watts: "W",
    scan_cta: "Scan with camera",
    scan_added: "Added to your list",
  };
}

export function CalculatorForm({ appliances, pricing, locale }: Props) {
  const router = useRouter();
  const t = useMemo(() => getDict(locale), [locale]);
  const [stepIndex, setStepIndex] = useState(0);
  const [picks, setPicks] = useState<AppliancePick[]>([]);
  const [hours, setHours] = useState(4);
  const [transitioning, setTransitioning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loaderStep, setLoaderStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  // Restore wizard state from localStorage on mount (survives language toggle / page refresh).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.v === STORAGE_VERSION) {
          if (Array.isArray(parsed.picks)) setPicks(parsed.picks);
          if (typeof parsed.hours === "number" && parsed.hours >= 1 && parsed.hours <= 12) setHours(parsed.hours);
          if (typeof parsed.stepIndex === "number" && parsed.stepIndex >= 0 && parsed.stepIndex <= CATEGORY_STEPS.length) {
            setStepIndex(parsed.stepIndex as 0 | 1);
          }
        }
      }
    } catch {
      // ignore corrupted state
    }
    setHydrated(true);
  }, []);

  // Persist wizard state on every change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: STORAGE_VERSION, picks, hours, stepIndex }));
    } catch {
      // ignore quota / private mode
    }
  }, [hydrated, picks, hours, stepIndex]);

  const grouped = useMemo(() => {
    const map = new Map<ApplianceCategory, Appliance[]>();
    for (const a of appliances) {
      const list = map.get(a.category) ?? [];
      list.push(a);
      map.set(a.category, list);
    }
    return map;
  }, [appliances]);

  const isHoursStep = stepIndex === CATEGORY_STEPS.length;
  const isCategoryStep = !isHoursStep;
  const currentCategory = isCategoryStep ? CATEGORY_STEPS[stepIndex] : null;
  const currentAppliances = currentCategory ? grouped.get(currentCategory) ?? [] : [];
  const currentTitle = isHoursStep ? t.hours.title : t.category[currentCategory!].title;
  const currentDescription = isHoursStep ? t.hours.description : t.category[currentCategory!].description;

  const totalPicks = picks.reduce((sum, p) => sum + p.count, 0);
  const totalRunningWatts = useMemo(() => {
    let sum = 0;
    for (const p of picks) {
      const a = appliances.find(x => x.id === p.applianceId);
      const v = a?.variants.find(x => x.id === p.variantId);
      if (v) sum += v.running_watts * p.count;
    }
    return sum;
  }, [picks, appliances]);

  // Loader animation while submitting
  useEffect(() => {
    if (!submitting) {
      setLoaderStep(0);
      return;
    }
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= t.loader_steps.length; i++) {
      timeouts.push(setTimeout(() => setLoaderStep(i), FINAL_LOADER_STEP_MS * i));
    }
    return () => timeouts.forEach(clearTimeout);
  }, [submitting, t.loader_steps.length]);

  function advance(toIndex: number) {
    setTransitioning(true);
    setTimeout(() => {
      setStepIndex(toIndex);
      setTransitioning(false);
    }, TRANSITION_MS);
  }

  function nextStep() {
    advance(stepIndex + 1);
  }

  function skipStep() {
    if (!currentCategory) return;
    const idsInCat = appliances.filter(a => a.category === currentCategory).map(a => a.id);
    if (idsInCat.length > 0) {
      setPicks(prev => prev.filter(p => !idsInCat.includes(p.applianceId)));
    }
    advance(stepIndex + 1);
  }

  function prevStep() {
    if (stepIndex > 0) advance(stepIndex - 1);
  }

  function addScannedPick(scanned: AppliancePick) {
    // Merge with existing picks: if the same variant is already there, increment count.
    setPicks(prev => {
      const existing = prev.find(p => p.applianceId === scanned.applianceId && p.variantId === scanned.variantId);
      if (existing) {
        return prev.map(p =>
          p === existing ? { ...p, count: p.count + scanned.count } : p,
        );
      }
      return [...prev, scanned];
    });
    toast.success(t.scan_added);
  }

  async function submit() {
    if (picks.length === 0) {
      toast.error(locale === "ar" ? "اختر جهاز واحد على الأقل" : "Pick at least one appliance");
      return;
    }
    setSubmitting(true);
    try {
      const r = calculateSizing({ picks, backupHours: hours }, appliances);
      const price = r.tooLarge
        ? { min: 0, max: 0 }
        : estimatePriceEgp(r.inverterKw, r.battery.qty, r.battery.ahEach, r.systemVoltage, pricing);
      const params = new URLSearchParams({
        kw: String(r.inverterKw), v: String(r.systemVoltage),
        bq: String(r.battery.qty), ba: String(r.battery.ahEach),
        w: String(r.totalRunningWatts),
        pmin: String(price.min), pmax: String(price.max),
        h: String(hours), big: r.tooLarge ? "1" : "0",
      });
      await new Promise(resolve => setTimeout(resolve, FINAL_LOADER_TOTAL_MS));
      router.push(`/${locale}/result?${params.toString()}`);
    } catch {
      toast.error(t.err_fail);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <WizardProgress steps={t.steps} current={stepIndex} locale={locale} />

      <div className="flex-1 min-h-0 flex flex-col py-2">
        {/* Centered scroll area — heading + body group, vertically centered when content fits */}
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto transition-opacity",
            transitioning ? "opacity-0 duration-200" : "opacity-100 duration-300",
          )}
        >
          <div className="min-h-full flex flex-col items-center justify-center gap-10 md:gap-14 py-4">
            {/* Step heading */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">{currentTitle}</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{currentDescription}</p>
              {isCategoryStep && (
                <button
                  type="button"
                  onClick={() => setScanOpen(true)}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  {t.scan_cta}
                </button>
              )}
            </div>

            {/* Step body */}
            <div className="w-full">
              {isHoursStep ? (
                <HoursStepBody
                  t={t}
                  hours={hours}
                  setHours={setHours}
                  appliances={appliances}
                  picks={picks}
                  pricing={pricing}
                  locale={locale}
                />
              ) : (
                <CategorySection
                  appliances={currentAppliances}
                  picks={picks}
                  locale={locale}
                  onPicksChange={setPicks}
                />
              )}
            </div>
          </div>
        </div>

        {/* Bottom nav — pinned */}
        <div className="shrink-0 flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={prevStep}
            disabled={stepIndex === 0 || transitioning || submitting}
            className={cn(
              "h-11 px-4 md:px-5 rounded-full border border-border font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2 shrink-0 text-sm",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
            )}
          >
            <ArrowLeft className={cn("h-4 w-4", locale === "ar" && "rotate-180")} />
            <span className="hidden sm:inline">{t.back}</span>
          </button>

          {totalPicks > 0 && (
            <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm text-sm">
              <span className="font-bold tabular-nums">{totalPicks}</span>
              <span className="text-muted-foreground">{t.summary_count}</span>
              <span className="text-border" aria-hidden>·</span>
              <span className="font-bold tabular-nums">{totalRunningWatts.toLocaleString()}</span>
              <span className="text-muted-foreground">{t.summary_watts}</span>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-3">
            {isCategoryStep && (
              <button
                type="button"
                onClick={skipStep}
                disabled={transitioning}
                className="h-11 px-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-medium transition-colors disabled:opacity-50"
              >
                {t.skip}
              </button>
            )}

            {isHoursStep ? (
              <button
                type="button"
                onClick={submit}
                disabled={submitting || transitioning}
                className={cn(
                  "h-11 px-5 md:px-6 rounded-full font-semibold transition-all flex items-center justify-center gap-2 shrink-0 text-sm",
                  "bg-primary text-primary-foreground shadow-md",
                  "hover:bg-[hsl(var(--primary-dark))] hover:shadow-lg",
                  "disabled:opacity-50",
                )}
              >
                <span className="truncate">{t.submit}</span>
                <ArrowRight className={cn("h-4 w-4 shrink-0", locale === "ar" && "rotate-180")} />
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                disabled={transitioning}
                className={cn(
                  "h-11 px-5 md:px-6 rounded-full font-semibold transition-all flex items-center gap-2 shrink-0 text-sm",
                  "bg-primary text-primary-foreground shadow-md",
                  "hover:bg-[hsl(var(--primary-dark))] hover:shadow-lg",
                  "disabled:opacity-50",
                )}
              >
                {t.next}
                <ArrowRight className={cn("h-4 w-4", locale === "ar" && "rotate-180")} />
              </button>
            )}
          </div>
        </div>
      </div>

      {scanOpen && (
        <ScanModal
          catalog={appliances}
          locale={locale}
          onAdd={addScannedPick}
          onClose={() => setScanOpen(false)}
        />
      )}

      {submitting && (
        <div
          className="fixed inset-0 z-[60] bg-background/85 backdrop-blur-md flex items-center justify-center px-6 animate-in fade-in duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="max-w-sm w-full text-center space-y-8">
            <div className="relative inline-flex">
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse" />
              <div className="relative h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/40">
                <Sparkles className="h-11 w-11" />
              </div>
            </div>

            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">{t.loader_title}</h3>

            <ol className="space-y-3 text-start max-w-xs mx-auto">
              {t.loader_steps.map((stepText, i) => {
                const isDone = loaderStep > i;
                const isActive = loaderStep === i;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center transition-all shrink-0",
                        isDone && "bg-success text-white",
                        isActive && "bg-primary text-primary-foreground",
                        !isDone && !isActive && "bg-muted text-muted-foreground",
                      )}
                    >
                      {isDone ? (
                        <Check className="h-4 w-4" />
                      ) : isActive ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-sm transition-colors",
                        isDone && "text-muted-foreground line-through",
                        isActive && "text-foreground font-semibold",
                        !isDone && !isActive && "text-muted-foreground",
                      )}
                    >
                      {stepText}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

interface HoursStepBodyProps {
  t: Dictionary;
  hours: number;
  setHours: (n: number) => void;
  appliances: Appliance[];
  picks: AppliancePick[];
  pricing: PricingTier;
  locale: "ar" | "en";
}

function HoursStepBody({ t: _t, hours, setHours, locale }: HoursStepBodyProps) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <HoursPicker hours={hours} locale={locale} onChange={setHours} />
      </div>
    </div>
  );
}
