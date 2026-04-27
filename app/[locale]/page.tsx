import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { AnkhLogo } from "@/components/ankh-logo";
import { LangToggle } from "@/components/lang-toggle";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: ["/og-image.png"],
      type: "website",
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
  };
}

export default async function LandingPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LandingContent locale={locale} />;
}

function LandingContent({ locale }: { locale: "ar" | "en" }) {
  const t = useTranslations("landing");

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="container flex items-center justify-between py-3 md:py-4">
          <Link href={`/${locale}`} aria-label="Manwar" className="inline-flex items-center">
            <AnkhLogo size={56} variant="white" />
          </Link>
          <LangToggle currentLocale={locale} />
        </div>
      </header>

      <section className="relative container py-16 md:py-28">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Text — left in LTR, right in RTL (logical-property friendly via order) */}
          <div className="space-y-6 md:space-y-8 text-center md:text-start order-2 md:order-1">
            <p
              className="text-xs font-semibold text-primary uppercase tracking-[0.18em] animate-hero-in"
              style={{ animationDelay: "0.1s" }}
            >
              {t("hero_kicker")}
            </p>
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-foreground animate-hero-in"
              style={{ animationDelay: "0.25s" }}
            >
              {t("hero_title")}
            </h1>
            <p
              className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto md:mx-0 animate-hero-in"
              style={{ animationDelay: "0.4s" }}
            >
              {t("hero_subtitle")}
            </p>
            <div
              className="pt-2 flex items-center justify-center md:justify-start animate-hero-in"
              style={{ animationDelay: "0.55s" }}
            >
              <Link
                href={`/${locale}/calculator`}
                className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                {t("cta_calculate")}
                <ArrowRight
                  className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${locale === "ar" ? "rotate-180 group-hover:-translate-x-1 group-hover:translate-x-0" : ""}`}
                />
              </Link>
            </div>
          </div>

          {/* Sun graphic — right in LTR, left in RTL */}
          <div className="order-1 md:order-2 flex items-center justify-center md:justify-end">
            <div className="relative w-full max-w-[640px] aspect-square flex items-center justify-center">
              {/* Soft golden halo behind the sun */}
              <div
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, hsl(45 100% 65% / 0.45), transparent 60%)" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/MANWAR-sun.svg"
                alt="Manwar"
                className="animate-logo-in w-full h-full object-contain drop-shadow-[0_8px_40px_rgba(255,187,0,0.35)]"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="relative border-t border-border">
        <DisclaimerBanner locale={locale} />
      </div>
    </main>
  );
}
