import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, AlertTriangle, Lightbulb, Zap, Clock, UserCheck } from "lucide-react";
import { ResultCard } from "@/components/result-card";
import { CostComparisonCard } from "@/components/cost-comparison-card";
import { ShopsList } from "@/components/shops-list";
import { LangToggle } from "@/components/lang-toggle";
import { AnkhLogo } from "@/components/ankh-logo";
import { buttonVariants } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { Card } from "@/components/ui/card";

function ResultHeader({ locale }: { locale: "ar" | "en" }) {
  const editLabel = locale === "ar" ? "تعديل اختياراتي" : "Edit my picks";
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container flex items-center justify-between gap-2 py-3 md:py-4">
        <Link href={`/${locale}`} aria-label="Manwar" className="inline-flex items-center">
          <AnkhLogo size={48} variant="white" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/calculator`}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/30 px-3 md:px-4 py-2 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className={locale === "ar" ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
            <span className="hidden sm:inline">{editLabel}</span>
          </Link>
          <LangToggle currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "result" });

  const tooLarge = sp.big === "1";

  if (tooLarge) {
    const isAr = locale === "ar";

    const copy = isAr
      ? {
          eyebrow: "تحذير",
          title: "محتاج نظام أكبر من اللي بنحسبه هنا",
          body: "بيتك بيطلب طاقة أكتر من اللي الإنفرتر السكني العادي ممكن يقدمها. ما تقلقش — ده مش مشكلة، في حلول.",
          why_title: "ليه ده بيحصل؟",
          why_body: "غالبًا بيحصل لما يكون عندك 5 تكييفات أو أكتر شغالة مع بعض، أو حملك فيه أجهزة كهربا تقيلة جدًا (سخان كهرباء، غسالة بسخان، إلخ) أو ساعات قطع طويلة مع كل ده.",
          tips_title: "إيه اللي تقدر تعمله؟",
          tips: [
            { icon: Zap,       text: "ارجع وشغّل خيار \"تكييف إنفرتر؟\" على كروت التكييف — التكييفات الإنفرتر بتسحب كهرباء أقل بكتير وقت التشغيل." },
            { icon: Clock,     text: "قلل عدد التكييفات أو الأجهزة الثقيلة، أو قلل ساعات القطع المطلوبة." },
            { icon: UserCheck, text: "لو فعلاً محتاج كل ده يشتغل مع بعض، تواصل مع مهندس مرخص يعمل لك دراسة حمل ونظام تجاري مخصص." },
          ],
          back: "تعديل اختياراتي",
        }
      : {
          eyebrow: "Warning",
          title: "We need a bigger system than this calculator covers",
          body: "Your home is asking for more power than a typical residential inverter can deliver. Don't worry — it's not a problem, there are options.",
          why_title: "Why is this happening?",
          why_body: "Usually it's because of 5+ ACs running together, very heavy appliances (electric water heaters, washers with built-in heaters), or long backup hours combined with all of that.",
          tips_title: "What you can try",
          tips: [
            { icon: Zap,       text: "Go back and toggle \"Inverter AC?\" on your AC cards — modern inverter ACs use far less startup power." },
            { icon: Clock,     text: "Reduce the number of ACs or heavy appliances, or pick fewer backup hours." },
            { icon: UserCheck, text: "If you really need all of this running together, talk to a licensed engineer for a custom commercial-grade system." },
          ],
          back: "Edit my picks",
        };

    return (
      <main className="min-h-screen bg-background">
        <ResultHeader locale={locale} />

        <section className="max-w-xl mx-auto px-6 py-12 md:py-16">
          <Card className="relative overflow-hidden p-0 border-warning/40 shadow-lg">
            {/* Warning gradient strip across the top */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-warning/25 via-warning/10 to-transparent pointer-events-none"
            />

            <div className="relative p-7 md:p-10 space-y-7 text-center">
              {/* Large warning icon */}
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-warning text-warning-foreground mx-auto shadow-lg shadow-warning/30 ring-8 ring-warning/15">
                <AlertTriangle className="h-10 w-10" strokeWidth={2.5} />
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-warning">{copy.eyebrow}</p>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{copy.title}</h1>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {copy.body}
                </p>
              </div>

              {/* Why it happens */}
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-5 text-start">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-warning mb-2">{copy.why_title}</p>
                <p className="text-sm text-foreground/85 leading-relaxed">{copy.why_body}</p>
              </div>

              {/* Tips */}
              <div className="text-start space-y-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary flex items-center gap-2 justify-center md:justify-start">
                  <Lightbulb className="h-3.5 w-3.5" />
                  {copy.tips_title}
                </p>
                <ul className="space-y-3">
                  {copy.tips.map((tip, i) => {
                    const Icon = tip.icon;
                    return (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground/85 leading-relaxed">
                        <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>{tip.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <Link
                href={`/${locale}/calculator`}
                className={buttonVariants({ className: "rounded-full px-6 w-full md:w-auto" })}
              >
                <ArrowLeft className={isAr ? "h-4 w-4 rotate-180 me-1" : "h-4 w-4 me-1"} />
                {copy.back}
              </Link>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  const inverterKw = Number(sp.kw);
  const systemVoltage = Number(sp.v);
  const batteryQty = Number(sp.bq);
  const batteryAh = Number(sp.ba);
  const priceMin = Number(sp.pmin);
  const priceMax = Number(sp.pmax);
  const totalRunningWatts = Number(sp.w);
  const hours = Number(sp.h);

  const hasValidData = [inverterKw, systemVoltage, batteryQty, batteryAh, priceMin, priceMax, hours]
    .every(n => Number.isFinite(n) && n >= 0);

  if (!hasValidData) {
    redirect(`/${locale}/calculator`);
  }

  return (
    <main className="min-h-screen bg-background">
      <ResultHeader locale={locale} />

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 space-y-8 md:space-y-10">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t("title")}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-6 items-start">
          <div className="lg:col-span-3">
            <ResultCard
              inverterKw={inverterKw}
              systemVoltage={systemVoltage}
              batteryQty={batteryQty}
              batteryAh={batteryAh}
              priceMin={priceMin}
              priceMax={priceMax}
              hours={hours}
              locale={locale}
            />
          </div>
          <div className="lg:col-span-2">
            <CostComparisonCard
              watts={Number.isFinite(totalRunningWatts) && totalRunningWatts > 0 ? totalRunningWatts : inverterKw * 1000}
              hours={hours}
              priceMin={priceMin}
              priceMax={priceMax}
              locale={locale}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-5">{t("shops_title")}</h2>
          <ShopsList locale={locale} />
        </div>
      </section>

      <DisclaimerBanner locale={locale} />
    </main>
  );
}
