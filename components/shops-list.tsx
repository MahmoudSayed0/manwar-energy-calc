"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { ShopCard } from "./shop-card";
import { trackEvent } from "@/lib/analytics";
import type { Shop, Governorate } from "@/lib/types";

interface Props {
  governorate?: Governorate;
  locale: "ar" | "en";
}

export function ShopsList({ governorate, locale }: Props) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.from("shops").select("*").eq("is_active", true);
        const all = (data ?? []) as Shop[];
        const tierWeight = (s: Shop) => (s.tier === "local" ? 0 : s.tier === "premium" ? 1 : 2);
        const govMatch = (s: Shop) => (governorate && s.governorate === governorate ? 0 : 1);
        const ordered = [...all].sort((a, b) => {
          const g = govMatch(a) - govMatch(b);
          if (g !== 0) return g;
          return tierWeight(a) - tierWeight(b);
        });
        setShops(ordered);
      } catch {
        setShops([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [governorate]);

  const empty = locale === "ar"
    ? "محلات قريبًا — شارك النتيجة على واتساب لتأخذ عرض سعر."
    : "More shops coming soon — share this result on WhatsApp to get quotes.";

  if (loading) return <div className="text-center text-muted-foreground py-8">...</div>;
  if (shops.length === 0) return <p className="text-sm text-muted-foreground py-4">{empty}</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {shops.map(s => <ShopCard key={s.id} shop={s} locale={locale} onShopClick={(id) => trackEvent("shop_click", { shop_id: id })} />)}
    </div>
  );
}
