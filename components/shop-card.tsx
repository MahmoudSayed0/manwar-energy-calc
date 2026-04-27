import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { MapPin, Globe, Phone, Sparkles, BadgeCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shop, ShopTier } from "@/lib/types";

interface Props {
  shop: Shop;
  locale: "ar" | "en";
  onShopClick: (shopId: string) => void;
}

const TIER_META: Record<ShopTier, { ar: string; en: string; badgeClass: string; ringClass: string; icon: typeof BadgeCheck }> = {
  local:   { ar: "محلي قريب",   en: "Nearby",   badgeClass: "bg-primary/10 text-primary",       ringClass: "from-primary/20 to-primary/5",       icon: MapPin },
  premium: { ar: "بريميوم",     en: "Premium",  badgeClass: "bg-amber-100 text-amber-900",      ringClass: "from-amber-200/40 to-amber-100/20", icon: BadgeCheck },
  digital: { ar: "أونلاين",     en: "Online",   badgeClass: "bg-violet-100 text-violet-900",    ringClass: "from-violet-200/40 to-violet-100/20", icon: Sparkles },
};

const AVATAR_PALETTE = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-violet-500", "bg-rose-500", "bg-cyan-500", "bg-orange-500",
];

function avatarBgFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  const cleaned = name.replace(/\([^)]*\)/g, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function ShopCard({ shop, locale, onShopClick }: Props) {
  const ctaMaps  = locale === "ar" ? "الموقع على الخريطة" : "Map";
  const ctaSite  = locale === "ar" ? "الموقع الإلكتروني"  : "Website";
  const ctaPhone = locale === "ar" ? "اتصل"               : "Call";
  const description = locale === "ar" ? shop.description_ar : shop.description_en;
  const tier = shop.tier ?? "local";
  const tierMeta = TIER_META[tier];
  const TierIcon = tierMeta.icon;
  const avatarBg = avatarBgFromName(shop.name);

  return (
    <Card className="relative overflow-hidden p-0 hover:border-primary/40 hover:shadow-md transition-all flex flex-col">
      <div className={cn("absolute inset-x-0 top-0 h-20 bg-gradient-to-br", tierMeta.ringClass)} aria-hidden />

      <div className="relative p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-start gap-3">
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt={shop.name}
              className="h-12 w-12 rounded-xl object-cover bg-white border border-border shrink-0"
            />
          ) : (
            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm", avatarBg)}>
              {getInitials(shop.name)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-base leading-tight truncate">{shop.name}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {shop.area}{shop.governorate !== "Other" ? `, ${shop.governorate}` : ""}
            </p>
          </div>

          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0", tierMeta.badgeClass)}>
            <TierIcon className="h-3 w-3" />
            {tierMeta[locale]}
          </span>
        </div>

        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {shop.specialty_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {shop.specialty_tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground inline-flex items-center gap-1">
                <Zap className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
          <a
            href={shop.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onShopClick(shop.id)}
            className={buttonVariants({ size: "sm", className: "flex-1 min-w-[110px] bg-primary hover:bg-[hsl(var(--primary-dark))] text-primary-foreground border-0" })}
          >
            <MapPin className="h-4 w-4 me-1" />
            {ctaMaps}
          </a>
          {shop.website_url && (
            <a
              href={shop.website_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onShopClick(shop.id)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
              aria-label={ctaSite}
              title={ctaSite}
            >
              <Globe className="h-4 w-4 me-1" />
              <span className="hidden sm:inline">{ctaSite}</span>
            </a>
          )}
          {shop.phone_number && (
            <a
              href={`tel:${shop.phone_number}`}
              onClick={() => onShopClick(shop.id)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
              aria-label={ctaPhone}
              title={ctaPhone}
            >
              <Phone className="h-4 w-4 me-1" />
              <span className="hidden sm:inline">{ctaPhone}</span>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
