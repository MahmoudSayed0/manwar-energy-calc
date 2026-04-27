"use client";

import { X, Trash2, Sparkles, Package } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import type { Appliance, AppliancePick } from "@/lib/types";

interface Props {
  picks: AppliancePick[];
  appliances: Appliance[];
  locale: "ar" | "en";
  onPicksChange: (picks: AppliancePick[]) => void;
  onClose: () => void;
}

export function SelectedItemsDialog({ picks, appliances, locale, onPicksChange, onClose }: Props) {
  const t = locale === "ar"
    ? {
        title: "اختياراتك",
        empty_title: "ما اخترت أي حاجة لسة",
        empty_body: "ارجع لخطوات الويزرد واختر الأجهزة اللي عندك.",
        clear_all: "مسح الكل",
        close: "إغلاق",
        done: "تمام",
        items: "جهاز",
        watts_unit: "وات",
        running_total: "إجمالي القدرة",
        custom: "مخصص",
        remove: "حذف",
      }
    : {
        title: "Your selection",
        empty_title: "Nothing selected yet",
        empty_body: "Go through the wizard steps and pick your appliances.",
        clear_all: "Clear all",
        close: "Close",
        done: "Done",
        items: "items",
        watts_unit: "W",
        running_total: "Running total",
        custom: "Custom",
        remove: "Remove",
      };

  const totalCount = picks.reduce((sum, p) => sum + p.count, 0);
  const totalWatts = picks.reduce((sum, p) => {
    if (p.customWatts != null) return sum + p.customWatts * p.count;
    const a = appliances.find(x => x.id === p.applianceId);
    const v = a?.variants.find(x => x.id === p.variantId);
    return sum + (v?.running_watts ?? 0) * p.count;
  }, 0);

  function removePick(pick: AppliancePick) {
    onPicksChange(picks.filter(p => p !== pick));
  }

  function clearAll() {
    onPicksChange([]);
  }

  function decrement(pick: AppliancePick) {
    if (pick.count <= 1) {
      removePick(pick);
      return;
    }
    onPicksChange(picks.map(p => p === pick ? { ...p, count: p.count - 1 } : p));
  }

  function increment(pick: AppliancePick) {
    onPicksChange(picks.map(p => p === pick ? { ...p, count: p.count + 1 } : p));
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card text-foreground rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[85dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="relative p-5 pb-3 border-b border-border">
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="absolute top-3 end-3 inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold tracking-tight pe-10">{t.title}</h2>
          {totalCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              <span className="font-semibold text-foreground">{totalCount}</span> {t.items}
              <span className="mx-1.5">·</span>
              <span className="font-semibold text-foreground">{totalWatts.toLocaleString()}</span> {t.watts_unit}
            </p>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          {picks.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-3">
              <Sparkles className="h-9 w-9 text-primary mx-auto" />
              <p className="font-bold text-sm">{t.empty_title}</p>
              <p className="text-xs text-muted-foreground">{t.empty_body}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {picks.map((pick, i) => (
                <PickRow
                  key={`${pick.applianceId}-${pick.variantId}-${i}`}
                  pick={pick}
                  appliances={appliances}
                  locale={locale}
                  onDecrement={() => decrement(pick)}
                  onIncrement={() => increment(pick)}
                  onRemove={() => removePick(pick)}
                  customLabel={t.custom}
                  wattsUnit={t.watts_unit}
                  removeLabel={t.remove}
                />
              ))}
            </ul>
          )}
        </div>

        <footer className="p-4 border-t border-border flex items-center justify-between gap-3">
          {picks.length > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 text-sm text-destructive hover:underline font-medium"
            >
              <Trash2 className="h-4 w-4" />
              {t.clear_all}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-[hsl(var(--primary-dark))] transition-colors"
          >
            {t.done}
          </button>
        </footer>
      </div>
    </div>
  );
}

function PickRow({
  pick,
  appliances,
  locale,
  onDecrement,
  onIncrement,
  onRemove,
  customLabel,
  wattsUnit,
  removeLabel,
}: {
  pick: AppliancePick;
  appliances: Appliance[];
  locale: "ar" | "en";
  onDecrement: () => void;
  onIncrement: () => void;
  onRemove: () => void;
  customLabel: string;
  wattsUnit: string;
  removeLabel: string;
}) {
  const isCustom = pick.customWatts != null;
  const appl = appliances.find(a => a.id === pick.applianceId);
  const variant = appl?.variants.find(v => v.id === pick.variantId);

  const Icon = isCustom
    ? Package
    : ((Icons as unknown as Record<string, typeof Package>)[toPascal(appl?.icon ?? "package")] ?? Package);

  const name = isCustom
    ? (pick.customLabel ?? customLabel)
    : (locale === "ar" ? appl?.name_ar : appl?.name_en) ?? "—";

  const variantLabel = !isCustom && variant
    ? (locale === "ar" ? variant.variant_label_ar : variant.variant_label_en)
    : null;
  const showVariant = variantLabel && variantLabel !== "—" && (appl?.variants.length ?? 0) > 1;

  const runningW = isCustom
    ? (pick.customWatts ?? 0)
    : (variant?.running_watts ?? 0);
  const totalW = runningW * pick.count;

  return (
    <li className="flex items-center gap-3 p-4">
      <span className={cn(
        "shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl",
        isCustom ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary",
      )}>
        <Icon className="h-5 w-5" />
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{name}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {showVariant && <>{variantLabel} · </>}
          {runningW.toLocaleString()} {wattsUnit}
          {pick.count > 1 && <> × {pick.count} = {totalW.toLocaleString()} {wattsUnit}</>}
          {pick.isInverter && <> · Inverter</>}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onDecrement}
          aria-label="decrease"
          className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-border hover:bg-muted text-sm font-bold"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums">{pick.count}</span>
        <button
          type="button"
          onClick={onIncrement}
          aria-label="increase"
          className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-border hover:bg-muted text-sm font-bold"
        >
          +
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          title={removeLabel}
          className="ms-1 h-8 w-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function toPascal(s: string): string {
  return s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("");
}
