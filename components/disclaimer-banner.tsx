import { Globe, Sparkles, ShieldCheck, Zap, Tag, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { Footer } from "./footer";
import { AnkhLogo } from "./ankh-logo";

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface Note {
  icon: typeof Sparkles;
  title: string;
  body: string;
}

function NotesSection({ locale, notes }: { locale: "ar" | "en"; notes: Note[] }) {
  const isAr = locale === "ar";
  return (
    <section className="container px-4 lg:px-8 max-w-5xl mx-auto py-14 md:py-20">
      <div className="text-center mb-10 md:mb-12">
        <p className="text-xs font-semibold text-primary uppercase tracking-[0.18em] mb-3">
          {isAr ? "اقرأ قبل الشراء" : "Before you buy"}
        </p>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          {isAr ? "ملاحظات مهمة" : "A few important notes"}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
          {isAr
            ? "حاجات تعرفها عن استخدام منور وقبل ما تتعامل مع أي محل."
            : "Things to know about using Manwar — and before you act on any recommendation."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {notes.map((note, i) => {
          const Icon = note.icon;
          const isOddLast = i === notes.length - 1 && notes.length % 2 === 1;
          return (
            <div
              key={i}
              className={cn(
                "group flex items-start gap-4 p-5 md:p-6 rounded-2xl border border-border bg-card",
                "hover:border-primary/40 hover:shadow-md transition-all",
                isOddLast && "md:col-span-2",
              )}
            >
              <div className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <h3 className="font-bold text-sm md:text-base text-foreground tracking-tight">{note.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{note.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function DisclaimerBanner({ locale }: { locale: "ar" | "en" }) {
  const isAr = locale === "ar";

  const notes: Note[] = isAr
    ? [
        { icon: Sparkles,    title: "أداة تخطيط مجانية",       body: "منور حاسبة مجانية، وكل الأرقام تقديرية للمساعدة في التخطيط فقط." },
        { icon: ShieldCheck, title: "تأكد مع فني مرخص",          body: "أكد المنظومة مع فني/مهندس مرخص قبل أي عملية شراء أو تركيب." },
        { icon: Zap,         title: "قيم استهلاك نموذجية",        body: "استهلاك الأجهزة قيم نموذجية في السوق المصري؛ جهازك الحقيقي ممكن يختلف." },
        { icon: Tag,         title: "السعر بيختلف من محل لمحل",  body: "السعر التقديري بيختلف حسب المورد، ماركة الإنفرتر، نوع البطارية، والضمان." },
        { icon: Store,       title: "ما بنبعش ولا بنركّب",         body: "منور مش بيبيع ولا بيركّب — بنوصلك بمحلات موثوقة، الباقي بينك وبينهم." },
      ]
    : [
        { icon: Sparkles,    title: "Free planning tool",            body: "Manwar is a free sizing calculator. All numbers are estimates for planning only." },
        { icon: ShieldCheck, title: "Confirm with a licensed pro",   body: "Verify the system with a licensed engineer or installer before any purchase or installation." },
        { icon: Zap,         title: "Typical wattage values",        body: "Appliance wattages are typical Egyptian-market values; your actual appliance may differ." },
        { icon: Tag,         title: "Pricing varies by supplier",    body: "Pricing is approximate and varies by supplier, inverter brand, battery chemistry, and warranty." },
        { icon: Store,       title: "We don't sell or install",      body: "Manwar does not sell or install equipment — we connect you with verified shops; the deal is between you and them." },
      ];

  const mainLinks = isAr
    ? [
        { href: `/${locale}`,            label: "الرئيسية" },
        { href: `/${locale}/calculator`, label: "الحاسبة" },
        { href: `/${locale}#shops`,      label: "المحلات" },
      ]
    : [
        { href: `/${locale}`,            label: "Home" },
        { href: `/${locale}/calculator`, label: "Calculator" },
        { href: `/${locale}#shops`,      label: "Suppliers" },
      ];

  const legalLinks = isAr
    ? [
        { href: "#",        label: "الخصوصية" },
        { href: "#",        label: "شروط الاستخدام" },
        { href: "#contact", label: "تواصل معنا" },
      ]
    : [
        { href: "#",        label: "Privacy" },
        { href: "#",        label: "Terms" },
        { href: "#contact", label: "Contact" },
      ];

  const socialLinks = [
    { href: "https://www.sikasio.com/",                  icon: <Globe className="h-4 w-4" />, label: "Sikasio website" },
    { href: "https://www.linkedin.com/company/sikasio/", icon: <LinkedInIcon />,              label: "Sikasio on LinkedIn" },
  ];

  return (
    <>
      <NotesSection locale={locale} notes={notes} />
      <Footer
        homeHref={`/${locale}`}
        logo={<AnkhLogo size={72} variant="black" />}
        socialLinks={socialLinks}
        mainLinks={mainLinks}
        legalLinks={legalLinks}
        copyright={{
          text: isAr ? "© 2026 Sikasio. كل الحقوق محفوظة." : "© 2026 Sikasio. All rights reserved.",
          license: isAr ? "صنع في مصر بحب" : "Made in Egypt with care",
        }}
      />
    </>
  );
}
