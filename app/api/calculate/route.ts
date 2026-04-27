import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { calculateSizing } from "@/lib/sizing";
import { estimatePriceEgp } from "@/lib/price-estimate";
import type { Appliance, SizingInput } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: SizingInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || !Array.isArray(body.picks) || typeof body.backupHours !== "number") {
    return NextResponse.json({ error: "Invalid payload shape" }, { status: 400 });
  }

  const supabase = getSupabase();

  const [{ data: appliances, error: aErr }, { data: variants, error: vErr }, { data: pricingRows, error: pErr }] =
    await Promise.all([
      supabase.from("appliances").select("*"),
      supabase.from("appliance_variants").select("*"),
      supabase.from("pricing").select("*").order("effective_from", { ascending: false }).limit(1),
    ]);

  if (aErr || vErr || pErr || !appliances || !variants || !pricingRows?.length) {
    return NextResponse.json({ error: "Catalog unavailable" }, { status: 503 });
  }

  const catalog: Appliance[] = appliances.map((a: any) => ({
    ...a,
    variants: variants.filter((v: any) => v.appliance_id === a.id).map((v: any) => ({
      id: v.id,
      variant_label_ar: v.variant_label_ar,
      variant_label_en: v.variant_label_en,
      running_watts: v.running_watts,
      surge_watts: v.surge_watts,
    })),
  })) as Appliance[];

  try {
    const result = calculateSizing(body, catalog);
    if (!result.tooLarge) {
      result.estimatedPriceEgp = estimatePriceEgp(
        result.inverterKw,
        result.battery.qty,
        result.battery.ahEach,
        result.systemVoltage,
        pricingRows[0],
      );
    }
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Calculation failed" }, { status: 400 });
  }
}
