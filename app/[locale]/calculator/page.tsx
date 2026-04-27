import { getSupabase } from "@/lib/supabase";
import { CalculatorForm } from "@/components/calculator-form";
import { LangToggle } from "@/components/lang-toggle";
import { AnkhLogo } from "@/components/ankh-logo";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import type { Appliance } from "@/lib/types";
import type { PricingTier } from "@/lib/price-estimate";

export const dynamic = "force-dynamic";

const FALLBACK_PRICING: PricingTier = {
  inverter_egp_per_kw_min: 4500,
  inverter_egp_per_kw_max: 7500,
  battery_egp_per_wh_min: 12,
  battery_egp_per_wh_max: 18,
};

export default async function CalculatorPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  let catalog: Appliance[] = [];
  let pricing: PricingTier = FALLBACK_PRICING;
  try {
    const supabase = getSupabase();
    const [{ data: appliances }, { data: variants }, { data: pricingRows }] = await Promise.all([
      supabase.from("appliances").select("*").order("sort_order"),
      supabase.from("appliance_variants").select("*").order("sort_order"),
      supabase.from("pricing").select("*").order("effective_from", { ascending: false }).limit(1),
    ]);

    catalog = (appliances ?? []).map((a: any) => ({
      ...a,
      variants: (variants ?? []).filter((v: any) => v.appliance_id === a.id),
    }));

    if (pricingRows && pricingRows.length > 0) {
      const row = pricingRows[0] as any;
      pricing = {
        inverter_egp_per_kw_min: Number(row.inverter_egp_per_kw_min) || FALLBACK_PRICING.inverter_egp_per_kw_min,
        inverter_egp_per_kw_max: Number(row.inverter_egp_per_kw_max) || FALLBACK_PRICING.inverter_egp_per_kw_max,
        battery_egp_per_wh_min: Number(row.battery_egp_per_wh_min) || FALLBACK_PRICING.battery_egp_per_wh_min,
        battery_egp_per_wh_max: Number(row.battery_egp_per_wh_max) || FALLBACK_PRICING.battery_egp_per_wh_max,
      };
    }
  } catch {
    catalog = [];
    pricing = FALLBACK_PRICING;
  }

  return (
    <main className="h-[100dvh] overflow-hidden bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-md shrink-0">
        <div className="container flex items-center justify-between py-3 md:py-4">
          <Link href={`/${locale}`} aria-label="Manwar" className="inline-flex items-center">
            <AnkhLogo size={48} variant="white" />
          </Link>
          <LangToggle currentLocale={locale} />
        </div>
      </header>

      <section className="flex-1 min-h-0 max-w-5xl w-full mx-auto px-4 md:px-6 pb-4 md:pb-6 flex flex-col">
        <CalculatorForm appliances={catalog} pricing={pricing} locale={locale} />
      </section>
    </main>
  );
}
